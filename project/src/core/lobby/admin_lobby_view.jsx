import React, { useEffect, useState, useRef } from 'react';
import { AuthContext } from '../Auth/AuthContext';
import usePlaySound from '../playsound';
import { useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './admin_lobby_view.css';
import { CountdownCircleTimer } from "react-countdown-circle-timer";
import { QRCodeSVG } from 'qrcode.react';
import toast, { Toaster } from 'react-hot-toast';
import ArrowHint from './lobby_progress_arrows';

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
const LobbyProgressBar = ({ lobbyState, playerCount, onStart, onEnd, lobbyCode, currentRound }) => {
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
    const [modal, setModal] = useState(null); // 'start' | 'end' | 'checkin' | null
    const [modalCopied, setModalCopied] = useState({ code: false, qr: false });
    // Track if check-in modal has ever been opened
    const [hasOpenedCheckinModal, setHasOpenedCheckinModal] = useState(false);
    // Track if check-in modal is currently open
    const checkinModalOpen = modal === 'checkin';

    // Handlers
    const handleStart = () => {
        setModal('start');
    };
    const handleEnd = () => {
        setModal('end');
    };
    const handleCheckin = () => {
        setHasOpenedCheckinModal(true);
        setModal('checkin');
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

    // Arrow should show only if: in checkin state, check-in modal has never been opened, and playerCount < 6
    const showCheckinArrow = checkinActive && !hasOpenedCheckinModal && playerCount < 6;

    // Arrow for Start Rounds: show only if in checkin state and playerCount >= 6
    const showStartArrow = lobbyState === 'checkin' && playerCount >= 6;

    // Arrow for End Rounds: show only if in active state and current_round + 1 >= 12
    const showEndArrow = lobbyState === 'active' && (currentRound + 1) >= 12;
   

    // Copy QR code as PNG (for modal only)
    const handleModalCopyQrPng = () => {
        const svg = document.getElementById('modal-qr-svg');
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
        img.onload = () => {
            ctx.clearRect(0, 0, size, size);
            ctx.drawImage(img, 0, 0, size, size);

            // Convert canvas to blob
            canvas.toBlob((blob) => {
                // Try to use Clipboard API first (for Chrome/Edge)
                if (navigator.clipboard && navigator.clipboard.write) {
                    navigator.clipboard.write([
                        new window.ClipboardItem({ "image/png": blob })
                    ]).then(() => {
                        setModalCopied((prev) => ({ ...prev, qr: true }));
                        setTimeout(() => setModalCopied((prev) => ({ ...prev, qr: false })), 800);
                    }).catch(() => {
                        // If Clipboard API fails, fall back to download
                        downloadQRCode(blob);
                    });
                } else {
                    // For browsers that don't support Clipboard API (Safari, Firefox)
                    downloadQRCode(blob);
                }
            }, "image/png");
        };
        img.onerror = () => alert("Failed to render QR code image.");
        img.src = 'data:image/svg+xml;base64,' + window.btoa(unescape(encodeURIComponent(svgString)));
    };

    // Helper function to download QR code
    function downloadQRCode(blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `reuneo-lobby-${lobbyCode}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setModalCopied((prev) => ({ ...prev, qr: true }));
        setTimeout(() => setModalCopied((prev) => ({ ...prev, qr: false })), 800);
    }

    // Copy lobby code text (for modal only)
    const handleModalCopyCode = () => {
        navigator.clipboard.writeText(lobbyCode);
        setModalCopied((prev) => ({ ...prev, code: true }));
        setTimeout(() => setModalCopied((prev) => ({ ...prev, code: false })), 800);
    };

    return (
        <div className="lobby-progress-bar" style={{ marginTop: '-1rem', height: '40px' }}>
            <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                <div
                    className={shimmerClass(checkinActive, false)}
                    tabIndex={0}
                    title="Check-in phase"
                    onClick={handleCheckin}
                    style={{ 
                        cursor: 'pointer', 
                        width: '100%', 
                        color: '#f5f7ff', 
                        textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)',
                        boxShadow: '0 7px 4px rgba(0, 0, 0, 0.1)'
                    }}
                >
                    Start Checkin
                </div>
                <ArrowHint direction="down" show={showCheckinArrow} />
            </div>
            <div
                style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}
            >
                <div
                    className={shimmerClass(startActive, startAvailable && !startActive)}
                    tabIndex={0}
                    title={startAvailable ? 'Start rounds' : 'At least 2 players required'}
                    onClick={handleStart}
                    style={{ 
                        cursor: 'pointer', 
                        width: '100%', 
                        color: '#f5f7ff', 
                        textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)',
                        boxShadow: '0 7px 4px rgba(0, 0, 0, 0.1)'
                    }}
                >
                    Start Rounds
                </div>
                <ArrowHint direction="down" show={showStartArrow} />
            </div>
            <div
                style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}
            >
                <div
                    className={shimmerClass(endActive, endAvailable && !endActive)}
                    tabIndex={0}
                    title={endAvailable ? 'End rounds' : 'Cannot end yet'}
                    onClick={handleEnd}
                    style={{ 
                        cursor: 'pointer', 
                        width: '100%', 
                        color: '#f5f7ff', 
                        textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)',
                        boxShadow: '0 7px 4px rgba(0, 0, 0, 0.1)'
                    }}
                >
                    End Rounds
                </div>
                <ArrowHint direction="down" show={showEndArrow} />
            </div>

            {/* Confirmation Modal */}
            {modal && (
                <div className="progress-modal-overlay">
                    <div className="progress-modal">
                        {modal === 'checkin' ? (
                            <>
                                <div className="progress-modal-title">
                                    Have your attendees can scan the QR code to join your lobby
                                </div>
                                <div className="progress-modal-message">
                                    You can start when you have 6-10 people, don't worry new people can join in the next rounds.
                                </div>
                                <div className="progress-modal-qr" onClick={handleModalCopyQrPng} style={{ cursor: 'pointer', position: 'relative' }}>
                                    <QRCodeSVG
                                        value={`${window.location.origin}/lobby?code=${lobbyCode}`}
                                        size={200}
                                        level="H"
                                        includeMargin={false}
                                        bgColor="#ffffff"
                                        fgColor="#144dff"
                                        id="modal-qr-svg"
                                    />
                                    <span className="copy-icon modal-copy-icon" aria-label="Copy" style={{ position: 'absolute', right: 8, bottom: 8, background: '#fff', borderRadius: '50%', padding: '2px' }}>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
                                            <rect x="9" y="9" width="13" height="13" rx="2.5" />
                                            <rect x="2" y="2" width="13" height="13" rx="2.5" />
                                        </svg>
                                    </span>
                                    {modalCopied.qr && <span className="modal-copied-feedback" style={{ position: 'absolute', left: '50%', bottom: '-1.5rem', transform: 'translateX(-50%)', color: '#28a745', fontWeight: 600, fontSize: '0.95rem' }}>Copied!</span>}
                                </div>
                                <div className={`progress-modal-lobbycode${modalCopied.code ? ' copied' : ''}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                    <b>lobby code: {lobbyCode}</b>
                                    <span className="copy-icon modal-copy-icon" aria-label="Copy" onClick={handleModalCopyCode} style={{ cursor: 'pointer' }}>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
                                            <rect x="9" y="9" width="13" height="13" rx="2.5" />
                                            <rect x="2" y="2" width="13" height="13" rx="2.5" />
                                        </svg>
                                    </span>
                                    {modalCopied.code && <span className="modal-copied-feedback" style={{ color: '#28a745', fontWeight: 600, fontSize: '0.95rem' }}>Copied!</span>}
                                </div>
                                <div className="progress-modal-actions">
                                    <button className="progress-modal-btn confirm" onClick={handleCancel}>Got it</button>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="progress-modal-title">
                                    {modal === 'start' ? 'Are you sure you want to start rounds?' : 'Are you sure you want to end the rounds?'}
                                </div>
                                <div className="progress-modal-actions">
                                    {modal === 'start' ? (
                                        <>
                                            <button className="progress-modal-btn cancel" onClick={handleCancel}>Not Yet</button>
                                            <button className="progress-modal-btn confirm" onClick={handleConfirm}>Start</button>
                                        </>
                                    ) : (
                                        <>
                                            <button className="progress-modal-btn cancel" onClick={handleCancel}>Keep Going</button>
                                            <button className="progress-modal-btn confirm danger" onClick={handleConfirm}>End</button>
                                        </>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// OverlappingProfileList component for compact, overlapping user profile images
const OverlappingProfileList = ({ players }) => {
    // Flatten paired players and combine with unpaired
    const allPlayers = [
        ...(players.pairedPlayers ? players.pairedPlayers.flat() : []),
        ...(players.lobbyData ? players.lobbyData : [])
    ];
    const maxVisible = 10;
    const visiblePlayers = allPlayers.slice(0, maxVisible);
    const overflowCount = allPlayers.length - maxVisible;
    const totalCount = allPlayers.length;

    return (
        <div className="overlapping-profile-list-wrapper" style={{ marginTop: '2rem' }}>
            <div className="overlapping-profile-list">
                {visiblePlayers.map((player, idx) => (
                    <img
                        key={player.username || player.name || idx}
                        src={player.pfp_data || "/assets/player_icon_trans.png"}
                        alt={player.name || "Player"}
                        className="overlapping-profile-img"
                        style={{ zIndex: idx + 1 }}
                    />
                ))}
                {overflowCount > 0 && (
                    <span className="overlapping-profile-overflow">+ {overflowCount}</span>
                )}
            </div>
            <div className="overlapping-profile-list-label" style={{ marginTop: '0.5rem',textShadow: '1px 1px 2px rgba(0, 0, 0, 0.1)' }}>People joined: {totalCount}</div>
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
    const [maxActiveRound, setMaxActiveRound] = useState(0);

    // Add playerCount and lobbyState for progress bar
    const playerCount = (lobbyData?.length || 0) + (pairedPlayers?.length * 2 || 0);

    const [showLobbyDetails, setShowLobbyDetails] = useState(false);

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
                    
                    
                    // Update maxActiveRound only if lobbyState is 'active' and current_round is higher
                    if (data.lobby_state === 'active') {
                        setMaxActiveRound(prev => (data.current_round > prev ? data.current_round : prev));
                    }
                    // Reset maxActiveRound if lobby is terminated
                    if (data.lobby_state === 'terminated') {
                        setMaxActiveRound(0);
                    }
                    
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
        img.onload = () => {
            ctx.clearRect(0, 0, size, size);
            ctx.drawImage(img, 0, 0, size, size);

            // Convert canvas to blob
            canvas.toBlob((blob) => {
                // Try to use Clipboard API first (for Chrome/Edge)
                if (navigator.clipboard && navigator.clipboard.write) {
                    navigator.clipboard.write([
                        new window.ClipboardItem({ "image/png": blob })
                    ]).then(() => {
                        toast.success("QR code copied to clipboard!");
                    }).catch(() => {
                        // If Clipboard API fails, fall back to download
                        downloadQRCode(blob);
                    });
                } else {
                    // For browsers that don't support Clipboard API (Safari, Firefox)
                    downloadQRCode(blob);
                }
            }, "image/png");
        };
        img.onerror = () => toast.error("Failed to generate QR code image.");
        img.src = 'data:image/svg+xml;base64,' + window.btoa(unescape(encodeURIComponent(svgString)));
    }

    // Helper function to download QR code
    function downloadQRCode(blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `reuneo-lobby-${lobbyCode}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success("QR code downloaded!");
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
                <div 
                    className="admin-view-logo"
                    onClick={() => navigate('/')}
                    style={{ cursor: 'pointer' }}
                >
                    <img 
                        src="/assets/reuneo_test_9.png"
                        alt="Reuneo Logo"
                        style={{
                            maxWidth: '85px',
                            height: 'auto',
                            objectFit: 'contain',
                            transition: 'transform 0.3s ease'
                        }}
                    />
                </div>
                <LobbyProgressBar 
                    lobbyState={lobbyState}
                    playerCount={playerCount}
                    onStart={handleStartRounds}
                    onEnd={handleEndRounds}
                    lobbyCode={lobbyCode}
                    currentRound={maxActiveRound}
                />
                {/* Overlapping user profile list below progress bar */}
                <OverlappingProfileList players={{ pairedPlayers, lobbyData }} />
                
                {/* Dropdown Toggle Bar/Header */}
                <div
                    className="admin-lobby-dropdown-toggle"
                    onClick={() => setShowLobbyDetails((prev) => !prev)}
                    style={{
                        cursor: 'pointer',
                        background: 'var(--primary-color)',
                        color: '#f5f7ff',
                        fontWeight: 700,
                        textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)',
                        fontSize: '.75rem',
                        borderRadius: showLobbyDetails ? '14px 14px 0 0' : '14px',
                        padding: '0.5rem 1rem',
                        margin: '0 auto',
                        maxWidth: 420,
                        boxShadow: '0 2px 8px rgba(20,77,255,0.08)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'background 0.2s',
                        letterSpacing: '0.5px',
                    }}
                >
                    {showLobbyDetails ? 'Hide Details' : 'Details'}
                    <span style={{ marginLeft: 12, fontSize: '1.2em', transition: 'transform 0.3s', display: 'inline-block', transform: showLobbyDetails ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                        ▼
                    </span>
                </div>
                {/* Dropdown Content */}
                <div
                    className="admin-lobby-body"
                    style={{
                        maxHeight: showLobbyDetails ? 1000 : 0,
                        overflow: 'hidden',
                        transition: 'max-height 0.5s cubic-bezier(0.4,0,0.2,1)',
                        opacity: showLobbyDetails ? 1 : 0,
                        pointerEvents: showLobbyDetails ? 'auto' : 'none',
                        marginBottom: showLobbyDetails ? '2rem' : 0,
                        
                        
                    }}
                >
                    <div className="admin-lobby-qr" onClick={handleCopyQrPng} style={{ cursor: 'pointer' }}>
                        <span className="qr-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
                            People scan to join
                            <span className="copy-icon" aria-label="Copy">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{display: 'block'}}>
                                    <rect x="9" y="9" width="13" height="13" rx="2.5"/>
                                    <rect x="2" y="2" width="13" height="13" rx="2.5"/>
                                </svg>
                            </span>
                        </span>
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
                            <span className="lobby-code-label">lobby code:</span>
                            <span className="lobby-code-value">{lobbyCode}</span>
                            <span className="copy-icon" aria-label="Copy">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{display: 'block'}}>
                                    <rect x="9" y="9" width="13" height="13" rx="2.5"/>
                                    <rect x="2" y="2" width="13" height="13" rx="2.5"/>
                                </svg>
                            </span>
                        </div>
                    </div>
                    <div className="admin-lobby-event-settings">
                        
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
                            style={{ marginTop: '.5rem' }}
                        >
                            Join Rounds
                        </button>
                        <div className="setting-item" style={{ padding: '1rem' }}>
                            <span className="setting-label">Round Duration: <span className="setting-value">{Math.floor(roundDuration / 60)} min</span></span>
                            <span className="setting-label" style={{ }}>Tags:</span>

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
                        
                    </div>
                </div>
                {/* Only render timer container if there is a timer to show */}
                {((lobbyState === "active" || lobbyState === "interrim") && lobbyTimer) && (
                    <div className="admin-lobby-timer-container">
                        <div className="admin-lobby-timer-glass">
                            <CountdownCircleTimer
                                key={`${lobbyState}-${Math.floor(lobbyTimer)}`}
                                isPlaying={lobbyState === "active"}
                                duration={roundDuration}
                                initialRemainingTime={lobbyTimer}
                                colors={["#144dff"]}
                                size={90}
                                strokeWidth={12}
                                trailColor="url(#trailGradient)"
                                onComplete={() => {
                                    return { shouldRepeat: false };
                                }}
                                strokeLinecap="round"
                            >
                                {({ remainingTime }) => {
                                    const mins = Math.floor(remainingTime / 60);
                                    const secs = Math.floor(remainingTime % 60);
                                    return (
                                        <span className={`timer-text ${remainingTime <= 10 ? 'timer-text-fadescale' : ''}`}>
                                            {mins}:{String(secs).padStart(2, "0")}
                                        </span>
                                    );
                                }}
                            </CountdownCircleTimer>
                            <span className="timer-subtext">round time left</span>
                            
                            {/* Gradient defs (for radial trail effect) */}
                            <svg width="0" height="0">
                                <defs>
                                    <linearGradient id="trailGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#e0e7ff" />
                                        <stop offset="100%" stopColor="#f5f7ff" />
                                    </linearGradient>
                                </defs>
                            </svg>
                        </div>
                    </div>
                )}

                {lobbyState !== 'checkin' && (
                    <div className="admin-lobby-stats">
                        <div className="stat-card">
                            <div className="stat-title">Total Players</div>
                            <div className="stat-value">{(lobbyData?.length || 0) + (pairedPlayers?.length * 2 || 0)}</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-title">Paired Players</div>
                            <div className="stat-value">{pairedPlayers?.length * 2 || 0}</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-title">Unpaired Players</div>
                            <div className="stat-value">{lobbyData?.length || 0}</div>
                        </div>
                    </div>
                )}
                
                {pairedPlayers && lobbyState !== 'checkin' && (
                    <div className="admin-lobby-players">
                        <div className="player-section">
                            <div className="section-header">Paired Players: <span className="stat-value" style={{ fontSize: '1.3rem' }}>{pairedPlayers?.length * 2 || 0}</span></div>
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
                            <div className="section-header">{lobbyState === 'checkin' ? 'People Joined' : 'Unpaired Players'}: <span className="stat-value" style={{ fontSize: '1.3rem' }}>{lobbyData?.length || 0}</span></div>
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