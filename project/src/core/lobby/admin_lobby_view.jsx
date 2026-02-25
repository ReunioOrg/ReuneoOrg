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
import { apiFetch } from '../utils/api';

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

// Generate styled QR code image with logo, text, and footer
const generateStyledQRCodeImage = (svgElement, code) => {
    return new Promise((resolve, reject) => {
        // Serialize SVG to string
        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(svgElement);

        // Canvas dimensions for printing (4:5 ratio)
        const canvasWidth = 800;
        const canvasHeight = 1000;
        const canvas = document.createElement('canvas');
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        const ctx = canvas.getContext('2d');

        // Set white background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        // Load logo image
        const logoImg = new window.Image();
        logoImg.crossOrigin = 'anonymous';
        
        logoImg.onload = () => {
            // Load QR code SVG as image
            const qrImg = new window.Image();
            qrImg.onload = () => {
                // Padding and spacing
                const topPadding = 2; // Further reduced to raise logo up more
                const bottomPadding = 32; // Further increased to bring footer code text up more from bottom
                const logoHeight = 180; // Tripled from 60
                const logoWidth = (logoImg.width / logoImg.height) * logoHeight;
                const subheaderFontSize = 36; // Doubled from 18
                const footerFontSize = 28; // Doubled from 14
                const qrSize = 550; // Largest element
                const spacing = 22; // Further reduced to tighten spacing

                // Calculate heights for centering
                const logoSectionHeight = topPadding + logoHeight + spacing;
                const subheaderSectionHeight = subheaderFontSize + spacing * 1.2; // Slightly reduced spacing
                const footerSectionHeight = footerFontSize + bottomPadding;
                const topSectionHeight = logoSectionHeight + subheaderSectionHeight;
                const bottomSectionHeight = footerSectionHeight;
                const availableHeight = canvasHeight - topSectionHeight - bottomSectionHeight;
                
                // Center QR code vertically in available space (shifted up more)
                const qrY = topSectionHeight + (availableHeight - qrSize) / 2 - 35; // Shifted up by 35px (was 20px)
                const qrX = (canvasWidth - qrSize) / 2;

                let currentY = topPadding;

                // Draw logo (centered)
                const logoX = (canvasWidth - logoWidth) / 2;
                ctx.drawImage(logoImg, logoX, currentY, logoWidth, logoHeight);
                currentY += logoHeight + spacing;

                // Draw subheader text
                ctx.fillStyle = '#000000';
                ctx.font = `600 ${subheaderFontSize}px Helvetica, Arial, sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'top';
                const subheaderText = 'Scan to join the ice-breaking session!';
                ctx.fillText(subheaderText, canvasWidth / 2, currentY);
                currentY += subheaderFontSize + spacing * 1.2;

                // Draw QR code (centered horizontally and vertically, shifted up)
                ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

                // Draw footer text - brought up from bottom
                const footerY = canvasHeight - bottomPadding - footerFontSize;
                ctx.font = `${footerFontSize}px Helvetica, Arial, sans-serif`;
                ctx.fillStyle = '#000000';
                ctx.textBaseline = 'top';
                const footerText = `code (optional): ${code}`;
                ctx.fillText(footerText, canvasWidth / 2, footerY);

                // Convert canvas to blob
                canvas.toBlob((blob) => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error('Failed to create blob'));
                    }
                }, 'image/png');
            };
            qrImg.onerror = () => reject(new Error('Failed to load QR code image'));
            qrImg.src = 'data:image/svg+xml;base64,' + window.btoa(unescape(encodeURIComponent(svgString)));
        };
        logoImg.onerror = () => reject(new Error('Failed to load logo image'));
        logoImg.src = '/assets/reuneo_test_9.png';
    });
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
    const [modalCopied, setModalCopied] = useState({ qr: false });
    // Track if check-in modal has ever been opened
    const [hasOpenedCheckinModal, setHasOpenedCheckinModal] = useState(false);
    // Track if check-in modal is currently open
    const checkinModalOpen = modal === 'checkin';
    // Ensure we only auto-open once per page load
    const didAutoOpenCheckinModalRef = useRef(false);

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

    // Auto-open check-in modal on page load if nobody has joined yet
    useEffect(() => {
        if (didAutoOpenCheckinModalRef.current) return;
        if (lobbyState === 'checkin' && playerCount === 0) {
            didAutoOpenCheckinModalRef.current = true;
            setHasOpenedCheckinModal(true);
            setModal('checkin');
        }
    }, [lobbyState, playerCount]);

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
   

    // Helper function to download QR code
    function downloadQRCode(blob, options = {}) {
        const { silent = false } = options;
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `reuneo-lobby-${lobbyCode}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        if (!silent) {
            setModalCopied((prev) => ({ ...prev, qr: true }));
            setTimeout(() => setModalCopied((prev) => ({ ...prev, qr: false })), 800);
        }
    }

    // Copy QR code as PNG (for modal only)
    const handleModalCopyQrPng = () => {
        const svg = document.getElementById('modal-qr-svg');
        if (!svg) return;

        generateStyledQRCodeImage(svg, lobbyCode)
            .then((blob) => {
                // Always download first (silent - no feedback yet)
                downloadQRCode(blob, { silent: true });

                // Try clipboard (bonus feature)
                if (navigator.clipboard && navigator.clipboard.write) {
                    navigator.clipboard.write([
                        new window.ClipboardItem({ "image/png": blob })
                    ]).then(() => {
                        // Clipboard succeeded - show unified feedback
                        setModalCopied((prev) => ({ ...prev, qr: true }));
                        setTimeout(() => setModalCopied((prev) => ({ ...prev, qr: false })), 800);
                    }).catch(() => {
                        // Clipboard failed, but download already happened - show feedback
                        setModalCopied((prev) => ({ ...prev, qr: true }));
                        setTimeout(() => setModalCopied((prev) => ({ ...prev, qr: false })), 800);
                    });
                } else {
                    // No clipboard API - download already happened, show feedback
                    setModalCopied((prev) => ({ ...prev, qr: true }));
                    setTimeout(() => setModalCopied((prev) => ({ ...prev, qr: false })), 800);
                }
            })
            .catch((error) => {
                console.error('Error generating QR code image:', error);
                alert("Failed to generate QR code image.");
            });
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
                                <div className="checkin-modal-header">
                                    <h2 className="checkin-modal-title">Share this QR Code</h2>
                                    <p className="checkin-modal-subtitle">
                                        Print or display it for your attendees to scan and join when they arrive at the event.
                                    </p>
                                </div>
                                <div className="checkin-modal-qr-wrapper" onClick={handleModalCopyQrPng}>
                                    <div className="checkin-modal-qr-card">
                                        <QRCodeSVG
                                            value={`${window.location.origin}/lobby?code=${lobbyCode}`}
                                            size={180}
                                            level="H"
                                            includeMargin={false}
                                            bgColor="#ffffff"
                                            fgColor="#1a1a2e"
                                            id="modal-qr-svg"
                                        />
                                        <div className="checkin-modal-qr-download-hint">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                <polyline points="7 10 12 15 17 10" />
                                                <line x1="12" y1="15" x2="12" y2="3" />
                                            </svg>
                                            <span>{modalCopied.qr ? 'Saved!' : 'Tap to save'}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="checkin-modal-code-badge">
                                    <span className="checkin-modal-code-label">Code</span>
                                    <span className="checkin-modal-code-value">{lobbyCode}</span>
                                </div>
                                <p className="checkin-modal-hint">
                                    Click Start whenever you want - new arrivals will get paired up immediately.
                                </p>
                                <div className="progress-modal-actions">
                                    <button className="checkin-modal-got-it" onClick={handleCancel}>Got it</button>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="confirm-modal-header">
                                    <h2 className="confirm-modal-title">
                                        {modal === 'start' ? 'Start Rounds' : 'End Rounds'}
                                    </h2>
                                    <p className="confirm-modal-subtitle">
                                        {modal === 'start' 
                                            ? 'Start pairing up your attendees! Don\'t worry - new arrivals will be paired up immediately.' 
                                            : 'Are you sure you want to end the rounds?'}
                                    </p>
                                </div>
                                <div className="confirm-modal-actions">
                                    {modal === 'start' ? (
                                        <>
                                            <button className="confirm-modal-btn secondary" onClick={handleCancel}>Not Yet</button>
                                            <button className="confirm-modal-btn primary" onClick={handleConfirm}>Start</button>
                                        </>
                                    ) : (
                                        <>
                                            <button className="confirm-modal-btn secondary" onClick={handleCancel}>Keep Going</button>
                                            <button className="confirm-modal-btn danger" onClick={handleConfirm}>End</button>
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

// Compact scrollable tag list for admin "More Controls" section
const AdminTagsScrollList = ({ tags }) => {
    const listRef = useRef(null);
    const [topOpacity, setTopOpacity] = useState(0);
    const [bottomOpacity, setBottomOpacity] = useState(1);

    useEffect(() => {
        const el = listRef.current;
        if (!el) return;
        if (el.scrollHeight <= el.clientHeight) {
            setBottomOpacity(0);
        }
    }, [tags]);

    const handleScroll = (e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        setTopOpacity(Math.min(scrollTop / 30, 1));
        const bottomDist = scrollHeight - (scrollTop + clientHeight);
        setBottomOpacity(scrollHeight <= clientHeight ? 0 : Math.min(bottomDist / 30, 1));
    };

    return (
        <div className="admin-tags-scroll-container">
            <div
                ref={listRef}
                className="admin-tags-scroll-list"
                onScroll={handleScroll}
            >
                {tags.map((tag, index) => (
                    <div key={index} className="admin-tag-item">
                        <span className="admin-tag-text">{tag}</span>
                    </div>
                ))}
            </div>
            <div className="admin-tags-gradient-top" style={{ opacity: topOpacity }}></div>
            <div className="admin-tags-gradient-bottom" style={{ opacity: bottomOpacity }}></div>
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
        <div className="overlapping-profile-list-wrapper" style={{ marginTop: '3rem' }}>
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
    const DEVMODE = false;
    
    // Audio sound feature - same as lobby.jsx
    const playat = Math.floor(9*60); // 540 seconds (9 minutes)
    const { audioRef, error, playSound, loadSound, seekTo, cancelSound, checkSound, soundEnabled, setSoundEnabled, isPlaying } = usePlaySound();
    const [showSoundPrompt, setShowSoundPrompt] = useState(true);
    const [isPageVisible, setIsPageVisible] = useState(!document.hidden);
    const roundPosition = useRef(null);
    
    // Extract lobby code from URL parameters
    const params = new URLSearchParams(location.search);
    const codeParam = params.get('code');
    const [lobbyCode, setLobbyCode] = useState(codeParam || 'test');


    // function to reset_lobby_timer
    const resetLobbyTimer = async () => {
        const response = await apiFetch('/reset_lobby_timer', {
            method: 'GET',
            headers: {
                'lobby_code': lobbyCode
            }
        });
    }

    // Check if lobby code is missing and redirect if needed
    useEffect(() => {
        if (!codeParam) {
            console.log("No lobby code found in URL, using default 'test' value");
            // If no code in URL, try to fetch the active lobby
            const fetchActiveLobby = async () => {
                try {
                    const response = await apiFetch('/view_my_active_lobbies');
                    
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
        const response = await apiFetch('/create_lobby', {
            method: 'POST',
            headers: {
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
    // Sound checking useEffect - same as lobby.jsx
    useEffect(() => {
        if (!checkSound()) {
            setSoundEnabled(false);
        } else {
            setSoundEnabled(true);
        }
    }, []);

    // Page visibility handler - same as lobby.jsx
    useEffect(() => {
        const handleVisibilityChange = () => {
            const isVisible = !document.hidden;
            
            // If page is becoming visible (was hidden before), update state
            // The polling interval will handle fetching with updated visibility state
            if (isVisible && !isPageVisible) {
                console.log("Page became visible - next poll will fetch latest data");
            }
            
            setIsPageVisible(isVisible);
        };
        
        document.addEventListener("visibilitychange", handleVisibilityChange);
        
        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, [isPageVisible]);

    // Cleanup audio when lobby becomes inactive or terminated
    useEffect(() => {
        if (lobbyState === "terminated" || lobbyState === "inactive") {
            cancelSound();
        }
    }, [lobbyState]);

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
                const response = await apiFetch(`/pfp_small_icon?username=${encodeURIComponent(username)}`);
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
                const isTabVisible = !document.hidden;
                const response = await apiFetch(`/admin_lobby_data?is_visible=${isTabVisible}`, {
                    headers: {
                        'is_visible_t_f': (isTabVisible) ? "t" : "f",
                        'lobby_code': lobbyCode
                    },
                });
                
                if (response.ok) {
                    const data = await response.json();
                    console.log("Admin lobby data:", lobbyCode, data);
                    
                    // Audio synchronization - same as lobby.jsx
                    // Check if lobby is inactive and cleanup audio
                    if (data.lobby_state === "inactive" || data.status === "inactive") {
                        cancelSound();
                    }
                    
                    // Audio seek logic - sync audio with round timing
                    const timeLeft = typeof data.round_time_left === 'number' && !isNaN(data.round_time_left) 
                        ? data.round_time_left 
                        : 0;
                    
                    roundPosition.current = timeLeft;
                    
                    if ((roundPosition.current != null) && (data.lobby_state === "active")) {
                        if (roundPosition.current != 0) {
                            seekTo(playat - roundPosition.current);
                            console.log("seeking to", playat - roundPosition.current);
                        }
                    }
                    
                    // Update maxActiveRound only if lobbyState is 'active' and current_round is higher
                    if (data.lobby_state === 'active') {
                        setMaxActiveRound(prev => (data.current_round > prev ? data.current_round : prev));
                    }
                    // Reset maxActiveRound if lobby is terminated
                    if (data.lobby_state === 'terminated') {
                        setMaxActiveRound(0);
                        cancelSound(); // Cleanup audio when terminated
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
                        setRoundDuration(data.round_duration || 300);
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

    // Helper function to download QR code
    function downloadQRCode(blob, options = {}) {
        const { silent = false } = options;
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `reuneo-lobby-${lobbyCode}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        if (!silent) {
            toast.success("QR code downloaded!");
        }
    }

    async function handleCopyQrPng() {
        const svg = document.getElementById('admin-qr-svg');
        if (!svg) return;

        generateStyledQRCodeImage(svg, lobbyCode)
            .then((blob) => {
                // Always download first (silent - no feedback yet)
                downloadQRCode(blob, { silent: true });

                // Try clipboard (bonus feature)
                if (navigator.clipboard && navigator.clipboard.write) {
                    navigator.clipboard.write([
                        new window.ClipboardItem({ "image/png": blob })
                    ]).then(() => {
                        // Clipboard succeeded - show unified feedback
                        toast.success("Downloaded and copied to clipboard!");
                    }).catch(() => {
                        // Clipboard failed, but download already happened - show feedback
                        toast.success("QR code downloaded!");
                    });
                } else {
                    // No clipboard API - download already happened, show feedback
                    toast.success("QR code downloaded!");
                }
            })
            .catch((error) => {
                console.error('Error generating QR code image:', error);
                toast.error("Failed to generate QR code image.");
            });
    }

    // SoundPrompt component - same as lobby.jsx but with bigger X button
    const SoundPrompt = () => {
        return (
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundColor: 'rgba(0, 0, 0, 0.125)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 1100
            }}>
                <div style={{
                    backgroundColor: 'white',
                    padding: '20px',
                    borderRadius: '8px',
                    position: 'relative',
                    minWidth: '300px'
                }}>
                    <button 
                        onClick={() => setShowSoundPrompt(false)}
                        style={{
                            color: '#144fff',
                            position: 'absolute',
                            right: '10px',
                            top: '10px',
                            border: 'none',
                            background: 'none',
                            fontSize: '16px', // Bigger than lobby.jsx (was 2px)
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            padding: '4px 8px'
                        }}
                    >
                    X   
                    </button>
                    <h2 style={{ marginTop: '5px' }}>The Sound is Important</h2>
                    <h3 style={{ marginTop: '5px' }}>Raise your volume also</h3>
                    <p style={{
                            color: '#144dff',
                        }}>You'll need this for the best experience.</p>
                    <button 
                        onClick={() => {
                            loadSound();
                            setShowSoundPrompt(false);
                        }}
                        style={{
                            padding: '10px 20px',
                            marginTop: '20px',
                            backgroundColor: '#144dff',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '14px',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                        }}
                    >
                        Enable Sound
                    </button>
                </div>
            </div>
        );
    };

    // Handlers for progress bar actions
    const handleStartRounds = async () => {
        const response = await apiFetch('/start_rounds', {
            method: 'GET',
            headers: {
                'lobby_code': lobbyCode
            }
        });
        // Optionally handle response
    };
    const handleEndRounds = async () => {
        cancelSound(); // Cleanup audio when terminating lobby
        const response = await apiFetch('/terminate_lobby', {
            method: 'GET',
            headers: {
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
                {DEVMODE && (
                    <button onClick={resetLobbyTimer}>
                        Reset Lobby Timer
                    </button>
                )}
                <div 
                    className="admin-view-logo"
                    style={{ cursor: 'pointer' }}
                >
                    <img 
                        src="/assets/reuneo_test_11.png"
                        alt="Reuneo Logo"
                        style={{
                            maxWidth: '85px',
                            height: 'auto',
                            objectFit: 'contain',
                            transition: 'transform 0.3s ease'
                        }}
                        onClick={() => navigate('/')}
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
                    {showLobbyDetails ? 'Hide Controls' : 'More Controls'}
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
                                fgColor="#000000"
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
                            <span className="setting-label">Tags: <span className="setting-value">{customTags?.length || 0}</span></span>

                            {customTags && customTags.length > 0 && (
                                <AdminTagsScrollList tags={customTags} />
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
                                colors={["#64B5F6", "#2196F3", "#1976D2"]}
                                colorsTime={[roundDuration, roundDuration / 2, 0]}
                                size={90}
                                strokeWidth={8}
                                trailColor="#f0f1f4"
                                onComplete={() => {
                                    return { shouldRepeat: false };
                                }}
                                strokeLinecap="round"
                            >
                                {({ remainingTime }) => {
                                    const validTime = typeof remainingTime === 'number' && !isNaN(remainingTime) ? remainingTime : 0;
                                    const mins = Math.floor(validTime / 60);
                                    const secs = Math.floor(validTime % 60);
                                    return (
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                            <span style={{ fontSize: '1.35rem', color: '#1a1a2e', fontWeight: 700, fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>
                                                {mins}:{String(secs).padStart(2, '0')}
                                            </span>
                                            <span style={{ fontSize: '0.6rem', color: '#6b7280', fontWeight: 500, marginTop: '2px' }}>time left</span>
                                        </div>
                                    );
                                }}
                            </CountdownCircleTimer>
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
                                {pairedPlayers.map((pair, index) => {
                                    const hasMatchDetails = (pair[0].match_details && pair[0].match_details.opponent_matched_tags && pair[0].match_details.opponent_matched_tags.length > 0) || 
                                                           (pair[1].match_details && pair[1].match_details.opponent_matched_tags && pair[1].match_details.opponent_matched_tags.length > 0);
                                    
                                    return (
                                        <div key={index} className="paired-player-card">
                                            {hasMatchDetails && (
                                                <div className="matched-pair-badge">Matched</div>
                                            )}
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
                                                {pair[0].match_details && pair[0].match_details.opponent_matched_tags && pair[0].match_details.opponent_matched_tags.length > 0 && (
                                                    <div className="matching-tag-container">
                                                        <div className="matched-player-tag">
                                                            {pair[0].match_details.opponent_matched_tags.map((tag, tagIndex) => (
                                                                <span key={tagIndex} className="matching-tag-pill">
                                                                    {tag}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
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
                                                {pair[1].match_details && pair[1].match_details.opponent_matched_tags && pair[1].match_details.opponent_matched_tags.length > 0 && (
                                                    <div className="matching-tag-container">
                                                        <div className="matched-player-tag">
                                                            {pair[1].match_details.opponent_matched_tags.map((tag, tagIndex) => (
                                                                <span key={tagIndex} className="matching-tag-pill">
                                                                    {tag}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
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

            {/* Sound Prompt - same conditional rendering as lobby.jsx */}
            {(soundEnabled || !showSoundPrompt) || (lobbyState == "checkin") || (lobbyState == null) || isPlaying ? null : <SoundPrompt />}
        </>
    );
}

export default AdminLobbyView;