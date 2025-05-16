import React, { useEffect, useState, useRef } from 'react';
import { AuthContext } from '../Auth/AuthContext';
import usePlaySound from '../playsound';
import { useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './admin_lobby_view.css';
import { CountdownCircleTimer } from "react-countdown-circle-timer";
import { QRCodeSVG } from 'qrcode.react';
import toast, { Toaster } from 'react-hot-toast';

//load asset image earthart.jpg
import { returnBase64TestImg } from '../misc/misc';

// Modal component for kick confirmation
const KickConfirmationModal = ({ isOpen, onClose, onConfirm, userName }) => {
    if (!isOpen) return null;

    return (
        <div className="kick-modal">
            <div className="kick-modal-content">
                <h2 className="kick-modal-title">Kick User</h2>
                <p className="kick-modal-message">Are you sure you want to kick {userName} from the lobby?</p>
                <div className="kick-modal-actions">
                    <button 
                        onClick={onConfirm}
                        className="admin-button admin-button-danger"
                    >
                        Yes, Kick User
                    </button>
                    <button 
                        onClick={onClose}
                        className="admin-button admin-button-primary"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

// Modal component for join confirmation
const JoinConfirmationModal = ({ isOpen, onClose, onConfirm }) => {
    if (!isOpen) return null;

    return (
        <div className="join-modal">
            <div className="join-modal-content">
                <h2 className="join-modal-title">Join Lobby</h2>
                <p className="join-modal-message">Are you sure you want to join? You will be paired up with your attendees.</p>
                <div className="join-modal-actions">
                    <button 
                        onClick={onConfirm}
                        className="admin-button admin-button-join"
                    >
                        Yes, Join Lobby
                    </button>
                    <button 
                        onClick={onClose}
                        className="admin-button admin-button-primary"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

// Progress bar component for lobby phases
const LobbyProgressBar = ({ lobbyState, playerCount, onStart, onEnd }) => {
    // Determine states for each arrow
    // Check-in
    const checkinActive = lobbyState === 'checkin';
    // Start Rounds
    const startAvailable = playerCount >= 2 && lobbyState === 'checkin';
    const startActive = lobbyState === 'active';
    // End Rounds
    const endAvailable = lobbyState === 'active';
    const endActive = lobbyState === 'terminated';

    // Modal state
    const [modal, setModal] = useState(null); // 'start' | 'end' | null

    // Handlers
    const handleStart = () => {
        if (startAvailable) setModal('start');
    };
    const handleEnd = () => {
        if (endAvailable) setModal('end');
    };
    const handleConfirm = () => {
        if (modal === 'start') {
            onStart();
            toast.success('Rounds started!', { position: 'top-center' });
        } else if (modal === 'end') {
            onEnd();
        }
        setModal(null);
    };
    const handleCancel = () => setModal(null);

    // Helper for shimmer classes
    const shimmerClass = (active, available) => {
        if (active) return 'progress-arrow active-shimmer';
        if (available) return 'progress-arrow available-shimmer';
        return 'progress-arrow inactive';
    };

    return (
        <div className="lobby-progress-bar">
            <div
                className={shimmerClass(checkinActive, false)}
                tabIndex={0}
                title="Check-in phase"
                style={{ cursor: 'default' }}
            >
                Check-in
            </div>
            <div
                className={shimmerClass(startActive, startAvailable && !startActive)}
                tabIndex={0}
                title={startAvailable ? 'Start rounds' : 'At least 2 players required'}
                onClick={handleStart}
                style={{ cursor: startAvailable ? 'pointer' : 'default' }}
            >
                Start Rounds
            </div>
            <div
                className={shimmerClass(endActive, endAvailable && !endActive)}
                tabIndex={0}
                title={endAvailable ? 'End rounds' : 'Cannot end yet'}
                onClick={handleEnd}
                style={{ cursor: endAvailable ? 'pointer' : 'default' }}
            >
                End Rounds
            </div>

            {/* Confirmation Modal */}
            {modal && (
                <div className="progress-modal-overlay">
                    <div className="progress-modal">
                        <div className="progress-modal-title">
                            {modal === 'start' ? 'Are you sure you want to start rounds?' : 'Are you sure you want to end the rounds?'}
                        </div>
                        <div className="progress-modal-actions">
                            <button className="progress-modal-btn confirm" onClick={handleConfirm}>Confirm</button>
                            <button className="progress-modal-btn cancel" onClick={handleCancel}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const AdminLobbyView = () => {
    const { user, userProfile, checkAuth, permissions } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();
    
    // Extract lobby code from URL parameters
    const params = new URLSearchParams(location.search);
    const codeParam = params.get('code');
    const [lobbyCode, setLobbyCode] = useState(codeParam || 'test');

    // Check if lobby code is missing and redirect if needed
    useEffect(() => {
        if (!codeParam) {
            console.log("No lobby code found in URL, using default 'test' value");
            // If no code in URL, try to fetch the active lobby
            const fetchActiveLobby = async () => {
                try {
                    const token = localStorage.getItem('access_token');
                    const response = await fetch(window.server_url + '/view_my_active_lobbies', {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    
                    if (response.ok) {
                        // Parse the response as JSON
                        const data = await response.json();
                        console.log("Active lobbies response:", data);
                        
                        // Check if the response has a lobbies array with at least one lobby
                        if (data && data.lobbies && data.lobbies.length > 0) {
                            // Use the first lobby in the array
                            const lobbyCode = data.lobbies[0];
                            
                            // Update the lobby code state
                            setLobbyCode(lobbyCode);
                            // Update the URL without refreshing the page
                            window.history.replaceState({}, '', `/admin_lobby_view?code=${lobbyCode}`);
                        }
                    }
                } catch (error) {
                    console.error("Error fetching active lobby:", error);
                }
            };
            
            fetchActiveLobby();
        }
    }, [codeParam]);

    // State for kick user modal
    const [isKickModalOpen, setIsKickModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    
    // State for join confirmation modal
    const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);

    const [pairedPlayers, setPairedPlayers] = useState(null);
    const [lobbyData, setLobbyData] = useState(null);
    const [lobbyTimer, setLobbyTimer] = useState(null);
    const [lobbyState, setLobbyState] = useState(null);
    const [roundDuration, setRoundDuration] = useState(null);
    const [profilePictures, setProfilePictures] = useState({}); // Cache for profile pictures
    const [customTags, setCustomTags] = useState([]); // Add state for custom tags

    // Add playerCount and lobbyState for progress bar
    const playerCount = (lobbyData?.length || 0) + (pairedPlayers?.length * 2 || 0);

    const CreateLobby = async () => {
        const response = await fetch(window.server_url + '/create_lobby', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                lobby_code: lobbyCode
            })
        })

        if (response.ok) {
            console.log("Lobby created successfully");
        } else {
            console.error("Failed to create lobby");
        }
    }
    useEffect(() => {
        checkAuth();

        if (permissions !== "admin" && permissions !== "organizer") {
            navigate('/');
            return;
        }

        const fetchProfilePicture = async (username) => {
            // Check if we already have this profile picture cached
            if (profilePictures[username]) {
                return profilePictures[username];
            }
            
            try {
                const response = await fetch(`${window.server_url}/pfp_small_icon?username=${encodeURIComponent(username)}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                    }
                });
                if (response.ok) {
                    // Get the base64 data from the response
                    let base64Data = await response.text();
                    
                    // Remove any quotes that might be wrapping the data
                    if (base64Data.startsWith('"') && base64Data.endsWith('"')) {
                        base64Data = base64Data.slice(1, -1);
                    }
                    
                    // Make sure the base64 data has the proper image prefix
                    const formattedData = base64Data.startsWith('data:image') 
                        ? base64Data 
                        : `data:image/jpeg;base64,${base64Data}`;
                        
                    // Update the cache
                    setProfilePictures(prev => ({
                        ...prev,
                        [username]: formattedData
                    }));
                    return formattedData;
                }
                return null;
            } catch (error) {
                console.error(`Error fetching profile picture for ${username}:`, error);
                return null;
            }
        };

        const interval = setInterval(async () => {
            try {
                const response = await fetch(window.server_url + '/admin_lobby_data', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                        'lobby_code': lobbyCode
                    },
                });
                
                if (response.ok) {
                    const data = await response.json();
                    console.log("Admin lobby data:", lobbyCode, data);
                    
                    // Check if data has the expected structure
                    if (data && data.unpaired_players) {
                        // Process unpaired players to add profile pictures
                        const unpairedWithPfp = await Promise.all(data.unpaired_players.map(async (player) => {
                            const pfpData = await fetchProfilePicture(player.username);
                            return {
                                ...player,
                                pfp_data: pfpData
                            };
                        }));
                        
                        // Process paired players to add profile pictures
                        const pairsWithPfp = await Promise.all((data.pairs_data || []).map(async (pair) => {
                            const player1PfpData = await fetchProfilePicture(pair[0].username);
                            const player2PfpData = await fetchProfilePicture(pair[1].username);
                            
                            return [
                                { ...pair[0], pfp_data: player1PfpData },
                                { ...pair[1], pfp_data: player2PfpData }
                            ];
                        }));
                        
                        setLobbyData(unpairedWithPfp);
                        setPairedPlayers(pairsWithPfp);
                        setLobbyTimer(data.round_time_left);
                        setLobbyState(data.lobby_state);
                        setRoundDuration(data.lobby_duration || 300); // Set lobby duration from server
                        setCustomTags(data.custom_tags || []); // Set custom tags from server
                    } else {
                        console.error("Invalid lobby data structure:", data);
                        setLobbyData([]);
                        setPairedPlayers([]);
                    }
                } else {
                    console.error("Failed to fetch admin lobby data:", response.status);
                }
            } catch (error) {
                console.error("Error fetching admin lobby data:", error);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [profilePictures]); // Add profilePictures to dependency array

    // Function to handle opening the kick modal
    const handleOpenKickModal = (user) => {
        setSelectedUser(user);
        setIsKickModalOpen(true);
    };

    // Function to handle closing the kick modal
    const handleCloseKickModal = () => {
        setIsKickModalOpen(false);
        setSelectedUser(null);
    };

    // Function to handle kicking a user
    const handleKickUser = () => {
        if (!selectedUser) return;

        fetch(window.server_url + '/kick_user', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: selectedUser.username,
                lobby_code: lobbyCode
            })
        })
        .then(response => {
            if (response.ok) {
                console.log(`User ${selectedUser.name} kicked successfully`);
            } else {
                console.error(`Failed to kick user ${selectedUser.name}`);
            }
        })
        .catch(error => {
            console.error("Error kicking user:", error);
        })
        .finally(() => {
            handleCloseKickModal();
        });
    };

    // Function to handle opening the join modal
    const handleOpenJoinModal = () => {
        setIsJoinModalOpen(true);
    };

    // Function to handle closing the join modal
    const handleCloseJoinModal = () => {
        setIsJoinModalOpen(false);
    };

    // Function to handle joining the lobby
    const handleJoinLobby = () => {
        navigate(`/lobby?code=${lobbyCode}`);
        handleCloseJoinModal();
    };

    async function handleCopyQrPng() {
        const svg = document.getElementById('admin-qr-svg');
        if (!svg) return;

        // Serialize SVG to string
        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(svg);

        // Create a canvas and draw the SVG onto it
        const img = new window.Image();
        const size = 512; // High quality
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        // Wait for image to load
        img.onload = async () => {
            ctx.clearRect(0, 0, size, size);
            ctx.drawImage(img, 0, 0, size, size);

            // Convert canvas to blob
            canvas.toBlob(async (blob) => {
                try {
                    await navigator.clipboard.write([
                        new window.ClipboardItem({ "image/png": blob })
                    ]);
                    // Optionally show feedback
                    alert("QR code copied as PNG!");
                } catch (err) {
                    alert("Copy failed. Try a Chromium-based browser.");
                }
            }, "image/png");
        };
        img.onerror = () => alert("Failed to render QR code image.");
        img.src = 'data:image/svg+xml;base64,' + window.btoa(unescape(encodeURIComponent(svgString)));
    }

    // Handlers for progress bar actions
    const handleStartRounds = async () => {
        const response = await fetch(window.server_url + '/start_rounds', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                'lobby_code': lobbyCode
            }
        });
        // Optionally handle response
    };
    const handleEndRounds = async () => {
        const response = await fetch(window.server_url + '/terminate_lobby', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                'lobby_code': lobbyCode
            }
        });
        if (response.ok) {
            navigate('/');
        }
    };

    return (
        <>
            {/* Toast container for react-hot-toast */}
            <Toaster position="top-center" />
            <div className="admin-lobby-container">
                <div className="admin-view-logo">
                    <img 
                        src="/assets/reuneo_test_9.png"
                        alt="Reuneo Logo"
                        style={{
                            maxWidth: '85px',
                            height: 'auto',
                            objectFit: 'contain'
                        }}
                    />
                </div>
                <LobbyProgressBar 
                    lobbyState={lobbyState}
                    playerCount={playerCount}
                    onStart={handleStartRounds}
                    onEnd={handleEndRounds}
                />
                <div className="page-controls-header">
                    <button 
                        onClick={() => navigate('/')} 
                        className="page-control-button page-control-home"
                    >
                        Home
                    </button>
                    <div className="admin-profile">
                        <img 
                            src={userProfile?.image_data ? `data:image/jpeg;base64,${userProfile.image_data}` : "/assets/player_icon_trans.png"} 
                            alt="Your Profile" 
                            className="admin-profile-picture"
                        />
                        <span className="admin-profile-name">
                            {userProfile?.name ? userProfile.name.slice(0, 20) : user?.slice(0, 20)}
                        </span>
                    </div>
                    <button 
                        onClick={handleOpenJoinModal} 
                        className="page-control-button page-control-join"
                    >
                        Join
                    </button>
                </div>
                <div className="lobby-code-container">
                    <div 
                        className="lobby-code-display"
                        onClick={() => {
                            navigator.clipboard.writeText(lobbyCode);
                            // Show copy feedback
                            const element = document.querySelector('.lobby-code-display');
                            element.classList.add('copied');
                            setTimeout(() => element.classList.remove('copied'), 250);
                        }}
                    >
                        <span className="lobby-code-label">lobby code: </span>
                        <span className="lobby-code-value">{lobbyCode}</span>
                        <span className="copy-icon" aria-label="Copy">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{display: 'block'}}>
                                <rect x="9" y="9" width="13" height="13" rx="2.5"/>
                                <rect x="2" y="2" width="13" height="13" rx="2.5"/>
                            </svg>
                        </span>
                    </div>
                </div>
                <div className="admin-lobby-body">
                    <div 
                        className="admin-lobby-qr"
                        onClick={handleCopyQrPng}
                        style={{ cursor: 'pointer' }}
                    >
                        <div style={{ position: "relative", display: "inline-block" }}>
                            <QRCodeSVG
                                value={`${window.location.origin}/lobby?code=${lobbyCode}`}
                                size={140}
                                level="H"
                                includeMargin={false}
                                bgColor="#ffffff"
                                fgColor="#144dff"
                                id="admin-qr-svg"
                            />
                        </div>
                        <span className="qr-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.5rem' }}>
                            People scan to join
                            <span className="copy-icon" aria-label="Copy">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{display: 'block'}}>
                                    <rect x="9" y="9" width="13" height="13" rx="2.5"/>
                                    <rect x="2" y="2" width="13" height="13" rx="2.5"/>
                                </svg>
                            </span>
                        </span>
                    </div>
                    <div className="admin-lobby-actions">
                        {/* <button 
                            onClick={() => {
                                if (window.confirm('Are you sure you want to reset the lobby timer?')) {
                                    fetch(window.server_url + '/reset_lobby_timer', {
                                        method: 'GET',
                                        headers: {
                                            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                                            'lobby_code': lobbyCode
                                        }
                                    })
                                }
                            }} 
                            className="admin-button admin-button-warning"
                        >
                            Reset Lobby Timer
                        </button> */}

                        {/* <button 
                            onClick={CreateLobby} 
                            className="admin-button admin-button-primary"
                        >
                            Create Lobby
                        </button> */}

                        {/* <button 
                            onClick={() => {
                                if (window.confirm('Are you sure you want to reset the entire lobby?')) {
                                    fetch(window.server_url + '/reset_lobby', {
                                        method: 'GET',
                                        headers: {
                                            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                                            'lobby_code': lobbyCode
                                        }
                                    })
                                }
                            }} 
                            className="admin-button admin-button-warning"
                        >
                            Reset Lobby
                        </button> */}

                        {/* <button 
                            onClick={() => {
                                if (window.confirm('Are you sure you want to start the rounds?')) {
                                    fetch(window.server_url + '/start_rounds', {
                                        method: 'GET',
                                        headers: {
                                            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                                            'lobby_code': lobbyCode
                                        }
                                    })
                                }
                            }} 
                            className="admin-lobby-event-controls admin-lobby-event-start"
                            style={{ backgroundColor: '#28a745' }}
                        >
                            Start
                        </button> */}

                        {/* <button 
                            onClick={async () => {
                                if (window.confirm('Are you sure you want to terminate the rounds?')) {
                                    const response = await fetch(window.server_url + '/terminate_lobby', {
                                        method: 'GET',
                                        headers: {
                                            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                                            'lobby_code': lobbyCode
                                        }
                                    })
                                    if (response.ok) {
                                        console.log("Lobby terminated successfully");
                                        navigate('/');
                                    } else {
                                        console.error("Failed to terminate lobby");
                                    }
                                }
                            }} 
                            className="admin-lobby-event-controls admin-lobby-event-end"
                        >
                            End
                        </button> */}
                        <div className="admin-lobby-event-settings">
                            <div className="setting-item">
                                <span className="setting-label">Round Duration:</span>
                                <span className="setting-value">{Math.floor(roundDuration / 60)} min</span>
                                <span className="setting-label">Tags:</span>

                                {customTags && customTags.length > 0 && (
                                    <div className="setting-item">
                                        <div className="tags-container">
                                            {customTags.slice(0, 3).map((tag, index) => (
                                                <span key={index} className="tag-pill">{tag}</span>
                                            ))}
                                            {customTags.length > 3 && (
                                                <span className="tag-pill more-tags">+{customTags.length - 3} more</span>
                                            )}
                                        </div>
                                    </div>
                                )}

                            </div>

                        </div>
                    </div>
                </div>
                {/* Only render timer container if there is a timer to show */}
                {((lobbyState === "active" || lobbyState === "interrim") && lobbyTimer) && (
                    <div className="admin-lobby-timer-container">
                        <div className="admin-lobby-timer">
                            <CountdownCircleTimer
                                key={`${lobbyState}-${Math.floor(lobbyTimer)}`}
                                isPlaying={lobbyState === "active"}
                                duration={roundDuration}
                                initialRemainingTime={lobbyTimer}
                                colors={["#144dff"]} 
                                size={90}
                                strokeWidth={12}
                                trailColor="#f5f7ff"
                                onComplete={() => {
                                    return { shouldRepeat: false }
                                }}
                            >
                                {({ remainingTime }) => {
                                    const mins = Math.floor(remainingTime / 60);
                                    const secs = Math.floor(remainingTime % 60);
                                    return (
                                        <span style={{ fontSize: '.95rem', color: '#144dff', fontWeight: 600 }}>
                                            {mins}:{String(secs).padStart(2, '0')}
                                        </span>
                                    );
                                }}
                            </CountdownCircleTimer>
                            <span style={{ fontSize: '0.7em', marginTop: '4px', opacity: '1', color: '#144dff' }}>round time left</span>
                        </div>
                    </div>
                )}

                <div className="admin-lobby-stats">
                    <div className="stat-card">
                        <div className="stat-title">Total Players</div>
                        <div className="stat-value">{(lobbyData?.length || 0) + (pairedPlayers?.length * 2 || 0)}</div>
                        <div className="stat-title">Paired Players</div>
                        <div className="stat-value">{pairedPlayers?.length * 2 || 0}</div>
                        <div className="stat-title">Unpaired Players</div>
                        <div className="stat-value">{lobbyData?.length || 0}</div>
                    </div>
                </div>
                
                {pairedPlayers && (
                    <div className="admin-lobby-players">
                        <div className="player-section">
                            <div className="section-header">Paired Players: {pairedPlayers?.length * 2 || 0}</div>
                            <div className="player-grid">
                                {pairedPlayers.map((pair, index) => (
                                    <div key={index} className="paired-player-card">
                                        <div 
                                            className="paired-player"
                                            onClick={() => handleOpenKickModal(pair[0])}
                                        >
                                            <img 
                                                src={pair[0].pfp_data} 
                                                alt={pair[0].name} 
                                                className="paired-player-avatar"
                                            />
                                            <h3 className="paired-player-name">{pair[0].name}</h3>
                                        </div>
                                        <div 
                                            className="paired-player"
                                            onClick={() => handleOpenKickModal(pair[1])}
                                        >
                                            <img 
                                                src={pair[1].pfp_data} 
                                                alt={pair[1].name}
                                                className="paired-player-avatar"
                                            />
                                            <h3 className="paired-player-name">{pair[1].name}</h3>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {lobbyData && (
                    <div className="admin-lobby-players">
                        <div className="player-section">
                            <div className="section-header">Unpaired Players: {lobbyData?.length || 0}</div>
                            <div className="player-grid">
                                {lobbyData.map((player, index) => (
                                    <div 
                                        key={index} 
                                        className="player-card"
                                        onClick={() => handleOpenKickModal(player)}
                                    >
                                        <img 
                                            src={player.pfp_data} 
                                            alt={player.name} 
                                            className="player-avatar"
                                        />
                                        <h3 className="player-name">{player.name}</h3>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Join Confirmation Modal */}
                <JoinConfirmationModal 
                    isOpen={isJoinModalOpen}
                    onClose={handleCloseJoinModal}
                    onConfirm={handleJoinLobby}
                />

                {/* Kick Confirmation Modal */}
                <KickConfirmationModal 
                    isOpen={isKickModalOpen}
                    onClose={handleCloseKickModal}
                    onConfirm={handleKickUser}
                    userName={selectedUser?.name || "this user"}
                />
            </div>
        </>
    );
}

export default AdminLobbyView;