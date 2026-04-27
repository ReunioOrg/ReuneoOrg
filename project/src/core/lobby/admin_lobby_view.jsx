import React, { useEffect, useState, useRef } from 'react';
import { AuthContext } from '../Auth/AuthContext';
import usePlaySound from '../playsound';
import { useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './admin_lobby_view.css';
import { CountdownCircleTimer } from "react-countdown-circle-timer";
import { QRCodeSVG } from 'qrcode.react';
import toast, { Toaster } from 'react-hot-toast';

import { apiFetch } from '../utils/api';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../cropImage';
import LoadingSpinner from '../components/LoadingSpinner';
import AdminCheckinTutorialFull from '../Tutorials/admin_checkin_tutorial_full';

//load asset image earthart.jpg
import { returnBase64TestImg } from '../misc/misc';

const AttendeeLimitWarningModal = ({ isOpen, onClose, playerCount, attendeeLimit, onUpgrade }) => {
    if (!isOpen) return null;
    const remaining = attendeeLimit - playerCount;

    return (
        <div className="progress-modal-overlay">
            <div className="progress-modal attendee-limit-warning">
                <div className="confirm-modal-header">
                    <h2 className="confirm-modal-title">
                        You're approaching your attendee limit!
                    </h2>
                    <p className="confirm-modal-subtitle">
                        <strong>{playerCount}</strong> of <strong>{attendeeLimit}</strong> spots filled
                        &mdash; only <strong>{remaining}</strong> spot{remaining !== 1 ? 's' : ''} left.
                        Upgrade your plan to welcome more attendees.
                    </p>
                </div>
                <div className="confirm-modal-actions">
                    <button className="confirm-modal-btn secondary" onClick={onClose}>Not Now</button>
                    <button className="confirm-modal-btn primary" onClick={onUpgrade}>Upgrade Now</button>
                </div>
            </div>
        </div>
    );
};

// Modal component for kick confirmation
const KickConfirmationModal = ({ isOpen, onClose, onConfirm, userName, userImage }) => {
    if (!isOpen) return null;

    return (
        <div className="kick-modal-overlay" onClick={onClose}>
            <div className="kick-modal-card" onClick={(e) => e.stopPropagation()}>
                <img
                    src={userImage || "/assets/avatar_3.png"}
                    alt={userName}
                    className="kick-modal-avatar"
                />
                <h2 className="kick-modal-heading">Remove {userName}?</h2>
                <p className="kick-modal-subtext">They will be removed from this session. Don't worry they can rejoin at any time</p>
                <div className="kick-modal-btn-row">
                    <button className="kick-modal-btn cancel" onClick={onClose}>
                        Cancel
                    </button>
                    <button className="kick-modal-btn danger" onClick={onConfirm}>
                        Remove
                    </button>
                </div>
            </div>
        </div>
    );
};

// Modal component for join confirmation
const JoinConfirmationModal = ({ isOpen, onClose, onConfirm, userProfile }) => {
    if (!isOpen) return null;

    const profileSrc = userProfile?.image_data
        ? `data:image/jpeg;base64,${userProfile.image_data}`
        : "/assets/avatar_3.png";

    return (
        <div className="join-modal-overlay" onClick={onClose}>
            <div className="join-modal-card" onClick={(e) => e.stopPropagation()}>
                <img
                    src={profileSrc}
                    alt="Your Profile"
                    className="join-modal-avatar"
                />
                <h2 className="join-modal-heading">Join as a participant?</h2>
                <p className="join-modal-subtext">You'll enter the rounds and get paired with your attendees just like everyone else.</p>
                <button className="join-modal-btn-primary" onClick={onConfirm}>
                    Join Pairing
                </button>
                <button className="join-modal-btn-secondary" onClick={onClose}>
                    Not now
                </button>
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
            const qrImg = new window.Image();
            qrImg.onload = () => {
                const font = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
                const monoFont = '"SF Mono", "Fira Code", "Courier New", monospace';
                const margin = 48;

                // Logo
                const logoHeight = 140;
                const logoWidth = (logoImg.width / logoImg.height) * logoHeight;
                const logoX = (canvasWidth - logoWidth) / 2;
                const logoY = margin;
                ctx.drawImage(logoImg, logoX, logoY, logoWidth, logoHeight);

                // Divider tight under logo
                const divider1Y = logoY + logoHeight + 12;
                ctx.strokeStyle = '#d1d5db';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(margin + 40, divider1Y);
                ctx.lineTo(canvasWidth - margin - 40, divider1Y);
                ctx.stroke();

                // Calculate content block (header + QR) to center vertically
                const headerFontSize = 34;
                const subFontSize = 28;
                const qrSize = 500;
                const headerBlockHeight = headerFontSize + 10 + subFontSize;
                const gapHeaderToQR = 32;
                const qrPadding = 20;
                const contentHeight = headerBlockHeight + gapHeaderToQR + qrSize + qrPadding * 2;
                const contentAreaTop = divider1Y + 16;
                const footerReserve = 70;
                const contentAreaBottom = canvasHeight - footerReserve;
                const contentStart = contentAreaTop + (contentAreaBottom - contentAreaTop - contentHeight) / 2;

                // Header line 1
                ctx.fillStyle = '#1a1a2e';
                ctx.font = `700 ${headerFontSize}px ${font}`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'top';
                ctx.letterSpacing = '2px';
                ctx.fillText('SCAN TO JOIN EXPERIENCE', canvasWidth / 2, contentStart);

                // Header line 2
                const subY = contentStart + headerFontSize + 10;
                ctx.font = `500 ${subFontSize}px ${font}`;
                ctx.fillStyle = '#4b5563';
                ctx.letterSpacing = '0.5px';
                ctx.fillText('Listen to the tutorial!', canvasWidth / 2, subY);
                ctx.letterSpacing = '0px';

                // QR code with light grey rounded border
                const qrContainerSize = qrSize + qrPadding * 2;
                const qrContainerX = (canvasWidth - qrContainerSize) / 2;
                const qrY = subY + subFontSize + gapHeaderToQR;

                ctx.beginPath();
                const r = 20;
                const bx = qrContainerX, by = qrY, bw = qrContainerSize, bh = qrContainerSize;
                ctx.moveTo(bx + r, by);
                ctx.lineTo(bx + bw - r, by);
                ctx.arcTo(bx + bw, by, bx + bw, by + r, r);
                ctx.lineTo(bx + bw, by + bh - r);
                ctx.arcTo(bx + bw, by + bh, bx + bw - r, by + bh, r);
                ctx.lineTo(bx + r, by + bh);
                ctx.arcTo(bx, by + bh, bx, by + bh - r, r);
                ctx.lineTo(bx, by + r);
                ctx.arcTo(bx, by, bx + r, by, r);
                ctx.closePath();
                ctx.strokeStyle = '#e5e7eb';
                ctx.lineWidth = 2;
                ctx.stroke();

                ctx.drawImage(qrImg, qrContainerX + qrPadding, qrY + qrPadding, qrSize, qrSize);

                // Footer — single line: "BACKUP CODE: <code>"
                const footerY = canvasHeight - margin - 10;
                ctx.textBaseline = 'bottom';
                ctx.textAlign = 'center';
                ctx.fillStyle = '#6b7280';
                ctx.font = `600 20px ${font}`;
                ctx.letterSpacing = '1px';
                const labelText = 'BACKUP CODE: ';
                const labelWidth = ctx.measureText(labelText).width;
                ctx.font = `700 20px ${monoFont}`;
                const codeWidth = ctx.measureText(code).width;
                const totalWidth = labelWidth + codeWidth;
                const startX = (canvasWidth - totalWidth) / 2;
                ctx.font = `600 20px ${font}`;
                ctx.textAlign = 'left';
                ctx.fillText(labelText, startX, footerY);
                ctx.font = `700 20px ${monoFont}`;
                ctx.fillStyle = '#1a1a2e';
                ctx.fillText(code, startX + labelWidth, footerY);
                ctx.letterSpacing = '0px';

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
        logoImg.src = '/assets/reuneo_test_11.png';
    });
};

// Progress bar component for lobby phases
const LobbyProgressBar = ({ lobbyState, playerCount, onStart, onEnd, lobbyCode, currentRound, checkinTriggerRef, suppressCheckinAutoOpen, planInfo, showStartPulse, onStartTutorial, startModalTriggerRef, showEndPulse, onEndTutorial, endModalTriggerRef }) => {
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

    // Activation warning for paid plans with >25 attendees
    const isPaidPlanActivation = planInfo && (planInfo.plan_type === 'single_use' || planInfo.plan_type === 'monthly') && playerCount > 25;
    const [activationPhase, setActivationPhase] = useState('idle');

    useEffect(() => {
        if (modal === 'start' && isPaidPlanActivation) {
            setActivationPhase('warning');
            const timer = setTimeout(() => setActivationPhase('ready'), 3000);
            return () => clearTimeout(timer);
        } else if (modal !== 'start') {
            setActivationPhase('idle');
        }
    }, [modal, isPaidPlanActivation]);

    // Handlers
    const handleStart = () => {
        if (checkinActive && onStartTutorial) {
            onStartTutorial();
        } else {
            setModal('start');
        }
    };
    const handleEnd = () => {
        if (endAvailable && onEndTutorial) {
            onEndTutorial();
        } else {
            setModal('end');
        }
    };
    const handleCheckin = () => {
        setHasOpenedCheckinModal(true);
        setModal('checkin');
    };

    useEffect(() => {
        if (checkinTriggerRef) {
            checkinTriggerRef.current = handleCheckin;
        }
    }, [checkinTriggerRef]);

    useEffect(() => {
        if (startModalTriggerRef) {
            startModalTriggerRef.current = () => setModal('start');
        }
    }, [startModalTriggerRef]);

    useEffect(() => {
        if (endModalTriggerRef) {
            endModalTriggerRef.current = () => setModal('end');
        }
    }, [endModalTriggerRef]);

    const handleConfirm = () => {
        if (modal === 'start') {
            onStart();
        } else if (modal === 'end') {
            onEnd();
        }
        setModal(null);
    };
    const handleCancel = () => setModal(null);

    // Auto-open disabled — inline QR on page makes it redundant

    const startBtnClass = () => {
        if (checkinActive) return 'progress-pill-btn progress-pill-start';
        return 'progress-pill-btn progress-pill-inactive';
    };

    const endBtnClass = () => {
        if (endAvailable) return 'progress-pill-btn progress-pill-end';
        return 'progress-pill-btn progress-pill-inactive';
    };

    const isInterrim = lobbyState === 'interrim';
    const startOnTop = checkinActive;
    const endOnTop = lobbyState === 'active' || lobbyState === 'terminated';
   

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
        <div className="lobby-progress-bar">
            <div className={`lobby-progress-track${isInterrim ? ' lobby-progress-interrim' : ''}`}>
                {isInterrim ? (
                    <span className="interrim-round-label">Creating Pairs...</span>
                ) : (
                    <>
                        <button
                            className={`${startBtnClass()}${startOnTop ? ' pill-on-top' : ''}`}
                            tabIndex={0}
                            title={startAvailable ? 'Start rounds' : 'At least 2 players required'}
                            onClick={handleStart}
                        >
                            Start
                            {showStartPulse && (
                                <>
                                    <span className="start-pill-ring start-pill-ring-1" />
                                    <span className="start-pill-ring start-pill-ring-2" />
                                </>
                            )}
                        </button>
                        <button
                            className={`${endBtnClass()}${endOnTop ? ' pill-on-top' : ''}`}
                            tabIndex={0}
                            title={endAvailable ? 'End rounds' : 'Cannot end yet'}
                            onClick={handleEnd}
                        >
                            End
                            {showEndPulse && (
                                <>
                                    <span className="end-pill-ring end-pill-ring-1" />
                                    <span className="end-pill-ring end-pill-ring-2" />
                                </>
                            )}
                        </button>
                    </>
                )}
            </div>

            {/* Confirmation Modal */}
            {modal && (
                <div className="progress-modal-overlay">
                    <div className="progress-modal">
                        {modal === 'checkin' ? (
                            <>
                                <div className="checkin-modal-header">
                                    <h2 className="checkin-modal-title">Display QR Code to People</h2>
                                    <p className="checkin-modal-subtitle">
                                        When attendees arrive at the event, tell people to scan and follow the app's instructions. Thats it!
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
                                            <span>{modalCopied.qr ? 'Saved!' : 'Tap to save/print'}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="checkin-modal-code-badge">
                                    <span className="checkin-modal-code-label">BACKUP CODE</span>
                                    <span className="checkin-modal-code-value">{lobbyCode}</span>
                                </div>
                                <p className="checkin-modal-hint">
                                    Click Start whenever you want - new arrivals will get paired up immediately.
                                </p>
                                <div className="progress-modal-actions">
                                    <button className="checkin-modal-got-it" onClick={handleCancel}>Got it</button>
                                </div>
                            </>
                        ) : modal === 'start' && isPaidPlanActivation ? (
                            <>
                                <div className="confirm-modal-header">
                                    {activationPhase === 'warning' ? (
                                        <h2 className="confirm-modal-title" style={{ animation: 'activationFadeIn 1s ease-out forwards' }}>
                                            You are about to activate your plan
                                        </h2>
                                    ) : (
                                        <h2 className="confirm-modal-title" style={{ animation: 'activationFadeIn 0.5s ease-out forwards' }}>
                                            Start Rounds
                                        </h2>
                                    )}
                                    <p className="confirm-modal-subtitle">
                                        Start pairing up your attendees! Don't worry - new arrivals will be paired up immediately.
                                    </p>
                                </div>
                                <div className="confirm-modal-actions">
                                    <button className="confirm-modal-btn secondary" onClick={handleCancel}>Not Yet</button>
                                    <button className="confirm-modal-btn primary" onClick={handleConfirm}>Start Activation</button>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="confirm-modal-header">
                                    <h2 className="confirm-modal-title">
                                        {modal === 'start' ? 'Start Rounds' : 'End Session to Start Match History'}
                                    </h2>
                                    <p className="confirm-modal-subtitle">
                                        {modal === 'start' 
                                            ? 'Start pairing up your attendees! Don\'t worry - new arrivals will be paired up immediately.' 
                                            : 'This will trigger the Matches History for everyone!'}
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
                                            <button className="confirm-modal-btn primary" onClick={handleConfirm}>End Session</button>
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
const OverlappingProfileList = ({ players, totalAttendeeCount, attendeeLimit, onUpgrade, lobbyState, planType }) => {
    const allPlayers = [
        ...(players.pairedPlayers ? players.pairedPlayers.flat() : []),
        ...(players.lobbyData ? players.lobbyData : [])
    ];
    const maxVisible = 10;
    const visiblePlayers = allPlayers.slice(0, maxVisible);
    const overflowCount = allPlayers.length - maxVisible;

    const displayCount = attendeeLimit
        ? Math.min(totalAttendeeCount, attendeeLimit)
        : totalAttendeeCount;

    const isFull = attendeeLimit && totalAttendeeCount >= attendeeLimit;
    const isAlmostFull = attendeeLimit && !isFull
        && totalAttendeeCount >= Math.floor(attendeeLimit * 0.9);

    const [jumpingIndices, setJumpingIndices] = useState([]);

    useEffect(() => {
        if (lobbyState !== 'checkin' || visiblePlayers.length === 0) {
            setJumpingIndices([]);
            return;
        }

        const interval = setInterval(() => {
            const count = Math.random() < 0.4 ? 2 : 1;
            const indices = [];
            const pool = [...Array(visiblePlayers.length).keys()];
            for (let i = 0; i < Math.min(count, pool.length); i++) {
                const pick = Math.floor(Math.random() * pool.length);
                indices.push(pool[pick]);
                pool.splice(pick, 1);
            }
            setJumpingIndices(indices);
            setTimeout(() => setJumpingIndices([]), 450);
        }, 1200);

        return () => clearInterval(interval);
    }, [lobbyState, visiblePlayers.length]);

    return (
        <div className="overlapping-profile-list-wrapper" style={{ marginTop: '3rem' }}>
            <div className="overlapping-profile-list">
                {visiblePlayers.map((player, idx) => (
                    <img
                        key={player.username || player.name || idx}
                        src={player.pfp_data || "/assets/player_icon_trans.png"}
                        alt={player.name || "Player"}
                        className={`overlapping-profile-img${jumpingIndices.includes(idx) ? ' profile-jumping' : ''}`}
                        style={{ zIndex: idx + 1 }}
                    />
                ))}
                {overflowCount > 0 && (
                    <span className="overlapping-profile-overflow">•••</span>
                )}
            </div>
            <div className="overlapping-profile-list-label" style={{ marginTop: '0.5rem' }}>
                People Joined: <span className="overlapping-profile-count">{displayCount}</span>
            </div>
            {attendeeLimit && (
                <div className="lobby-capacity-bar-wrapper">
                    <div className="lobby-capacity-bar-track">
                        <div
                            className={`lobby-capacity-bar-fill${displayCount >= Math.round(attendeeLimit * 0.9) ? ' lobby-capacity-bar-warning' : ''}`}
                            style={{ width: `${Math.min((displayCount / attendeeLimit) * 100, 100)}%` }}
                        />
                    </div>
                    <span className={`lobby-capacity-fraction${displayCount >= Math.round(attendeeLimit * 0.9) ? ' lobby-capacity-fraction-warning' : ''}`}>
                        {displayCount} / {attendeeLimit}
                    </span>
                    {planType === 'free_trial' && onUpgrade && (
                        <button className="upgrade-pill" onClick={onUpgrade}>
                            <span className="upgrade-pill-text">UPGRADE</span>
                        </button>
                    )}
                </div>
            )}
            {planType !== 'free_trial' && (isAlmostFull || isFull) && onUpgrade && (
                <button
                    className={`capacity-badge ${isFull ? 'capacity-badge-full' : 'capacity-badge-info'}`}
                    onClick={onUpgrade}
                >
                    {isFull ? 'LOBBY FULL' : 'ALMOST FULL'}
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="16" x2="12" y2="12"/>
                        <line x1="12" y1="8" x2="12.01" y2="8"/>
                    </svg>
                </button>
            )}
        </div>
    );
};

const SoundPrompt = ({ onEnable, onDismiss }) => {
    return (
        <div className="sound-prompt-overlay">
            <div className="sound-prompt-modal">
                <div className="sound-prompt-icon">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2196F3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                        <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                    </svg>
                </div>
                <h2 className="sound-prompt-title">Stay in the loop on what's happening!</h2>
                <p className="sound-prompt-subtitle">Turn up your volume to hear the event updates.</p>
                <button 
                    className="sound-prompt-enable"
                    onClick={onEnable}
                >
                    Enable Sound
                </button>
                <button 
                    className="sound-prompt-skip"
                    onClick={onDismiss}
                >
                    Skip
                </button>
            </div>
        </div>
    );
};

const EditLobbyModal = ({ isOpen, onClose, lobbyCode, currentTags, currentShowTableNumbers, currentRoundDuration, lobbyState }) => {
    const [editTags, setEditTags] = useState([]);
    const [editTagInput, setEditTagInput] = useState('');
    const [editShowTableNumbers, setEditShowTableNumbers] = useState(false);
    const [editMinutes, setEditMinutes] = useState('5');
    const [editSeconds, setEditSeconds] = useState('0');
    const MaxMinutes = 8;

    // Logo state
    const [existingLogo, setExistingLogo] = useState(null);
    const [logoPreview, setLogoPreview] = useState(null);
    const [logoCroppedImage, setLogoCroppedImage] = useState(null);
    const [logoRemoved, setLogoRemoved] = useState(false);
    const [isLogoCropping, setIsLogoCropping] = useState(false);
    const [isLogoProcessing, setIsLogoProcessing] = useState(false);
    const [logoCrop, setLogoCrop] = useState({ x: 0, y: 0 });
    const [logoZoom, setLogoZoom] = useState(1);
    const [logoCropArea, setLogoCropArea] = useState(null);
    const [logoError, setLogoError] = useState('');

    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [logoLoading, setLogoLoading] = useState(false);
    const wasOpenRef = useRef(false);

    const hasTags = currentTags && currentTags.length > 0;

    useEffect(() => {
        if (isOpen && !wasOpenRef.current) {
            wasOpenRef.current = true;
            setEditTags([...(currentTags || [])]);
            setEditShowTableNumbers(currentShowTableNumbers ?? false);
            const durSecs = currentRoundDuration || 300;
            setEditMinutes(String(Math.floor(durSecs / 60)));
            setEditSeconds(String(Math.floor(durSecs % 60)));
            setError('');
            setEditTagInput('');
            setLogoCroppedImage(null);
            setLogoPreview(null);
            setLogoRemoved(false);
            setIsLogoCropping(false);
            setLogoError('');
            setLogoCrop({ x: 0, y: 0 });
            setLogoZoom(1);
            setLogoCropArea(null);

            setLogoLoading(true);
            apiFetch('/lobby_setup_data', {
                headers: { 'lobby_code': lobbyCode }
            })
                .then(res => res.json())
                .then(data => {
                    if (data.logo_icon) {
                        setExistingLogo(`data:image/jpeg;base64,${data.logo_icon}`);
                    } else {
                        setExistingLogo(null);
                    }
                })
                .catch(() => setExistingLogo(null))
                .finally(() => setLogoLoading(false));
        }
        if (!isOpen) {
            wasOpenRef.current = false;
        }
    }, [isOpen, currentTags, currentShowTableNumbers, lobbyCode]);

    if (!isOpen) return null;

    const handleAddTag = () => {
        if (editTagInput.includes(',')) {
            const potentialTags = editTagInput.split(',').map(t => t.trim()).filter(Boolean);
            const newTags = [];
            potentialTags.forEach(tag => {
                if (tag && !editTags.includes(tag) && !newTags.includes(tag) && tag.length <= 50) {
                    newTags.push(tag);
                }
            });
            if (newTags.length > 0) setEditTags(prev => [...prev, ...newTags].slice(0, 50));
            setEditTagInput('');
        } else {
            const trimmed = editTagInput.trim();
            if (trimmed && !editTags.includes(trimmed) && trimmed.length <= 50 && editTags.length < 50) {
                setEditTags(prev => [...prev, trimmed]);
                setEditTagInput('');
            }
        }
    };

    const handleRemoveTag = (tagToRemove) => {
        setEditTags(prev => prev.filter(t => t !== tagToRemove));
    };

    const handleTagKeyDown = (e) => {
        if (e.key === 'Enter' && editTagInput.trim()) {
            e.preventDefault();
            handleAddTag();
        }
    };

    const resizeImage = (file, maxWidth, maxHeight) => {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                let { width, height } = img;
                if (width > height) {
                    if (width > maxWidth) { height = (height * maxWidth) / width; width = maxWidth; }
                } else {
                    if (height > maxHeight) { width = (width * maxHeight) / height; height = maxHeight; }
                }
                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.7));
            };
            img.src = URL.createObjectURL(file);
        });
    };

    const handleLogoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setLogoError('');
        setIsLogoProcessing(true);
        if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
            setLogoError('Invalid format. Please upload a JPG or PNG image.');
            setIsLogoProcessing(false);
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            setLogoError('File too large. Please choose an image under 2MB.');
            setIsLogoProcessing(false);
            return;
        }
        try {
            const resizedImage = await resizeImage(file, 400, 400);
            setLogoPreview(resizedImage);
            setIsLogoCropping(true);
            setIsLogoProcessing(false);
        } catch (err) {
            console.error('Error processing image:', err);
            setLogoError('Error processing image. Please try again.');
            setIsLogoProcessing(false);
        }
    };

    const handleLogoCropComplete = (croppedArea, croppedAreaPixels) => {
        setLogoCropArea(croppedAreaPixels);
    };

    const handleSaveLogoCrop = async () => {
        try {
            setIsLogoProcessing(true);
            const croppedImage = await getCroppedImg(logoPreview, logoCropArea);
            setLogoCroppedImage(croppedImage);
            setIsLogoCropping(false);
            setIsLogoProcessing(false);
            setLogoRemoved(false);
        } catch (err) {
            console.error('Error cropping logo:', err);
            setLogoError('Error processing image. Please try again.');
            setIsLogoCropping(false);
            setIsLogoProcessing(false);
        }
    };

    const handleRemoveLogo = () => {
        setLogoPreview(null);
        setLogoCroppedImage(null);
        setIsLogoCropping(false);
        setIsLogoProcessing(false);
        setLogoCrop({ x: 0, y: 0 });
        setLogoZoom(1);
        setLogoCropArea(null);
        setLogoError('');
        setLogoRemoved(true);
        const fileInput = document.getElementById('editLogoUpload');
        if (fileInput) fileInput.value = '';
    };

    const handleSave = async () => {
        setError('');
        const body = { lobby_code: lobbyCode };
        let hasChanges = false;

        if (hasTags) {
            const tagsChanged = JSON.stringify(editTags) !== JSON.stringify(currentTags);
            if (tagsChanged) {
                if (editTags.length < 2) {
                    setError('Minimum 2 tags required.');
                    return;
                }
                body.custom_tags = editTags;
                hasChanges = true;
            }
        }

        if (editShowTableNumbers !== currentShowTableNumbers) {
            body.show_table_numbers = editShowTableNumbers;
            hasChanges = true;
        }

        if (lobbyState === 'checkin') {
            const newDuration = (parseInt(editMinutes) || 0) * 60 + (parseInt(editSeconds) || 0);
            if (newDuration !== (currentRoundDuration || 300)) {
                body.round_duration = newDuration;
                hasChanges = true;
            }
        }

        if (logoCroppedImage) {
            body.logo_icon = logoCroppedImage.split(',')[1];
            hasChanges = true;
        } else if (logoRemoved) {
            body.logo_icon = null;
            hasChanges = true;
        }

        if (!hasChanges) {
            onClose();
            return;
        }

        setIsSaving(true);
        try {
            const response = await apiFetch('/edit_lobby', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await response.json();
            if (data.status === 'success') {
                toast.success('Lobby updated!', { position: 'top-center' });
                onClose();
            } else {
                setError(data.message || 'Failed to update lobby.');
            }
        } catch (err) {
            console.error('Error updating lobby:', err);
            setError('An error occurred while updating the lobby.');
        } finally {
            setIsSaving(false);
        }
    };

    const currentLogoDisplay = logoCroppedImage || (!logoRemoved ? existingLogo : null);

    return (
        <div className="edit-lobby-modal-overlay" onClick={onClose}>
            <div className="edit-lobby-modal-card" onClick={(e) => e.stopPropagation()}>
                <h2 className="edit-lobby-modal-title">Edit Lobby Settings</h2>

                {/* Tags Section */}
                <div className="edit-lobby-section">
                    <span className="edit-lobby-section-label">Matching Categories</span>
                    {hasTags ? (
                        <>
                            <div className="edit-lobby-tag-input-row">
                                <input
                                    type="text"
                                    value={editTagInput}
                                    onChange={(e) => setEditTagInput(e.target.value)}
                                    onKeyDown={handleTagKeyDown}
                                    placeholder="Add categories (press + to add)"
                                    className="edit-lobby-tag-input"
                                    autoComplete="off"
                                />
                                <button type="button" onClick={handleAddTag} className="edit-lobby-tag-add-btn">+</button>
                            </div>
                            {editTags.length > 0 && (
                                <div className="edit-lobby-tag-list">
                                    {editTags.map((tag, index) => (
                                        <div key={index} className="edit-lobby-tag-item">
                                            {tag}
                                            <button type="button" onClick={() => handleRemoveTag(tag)} className="edit-lobby-tag-remove">×</button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {editTags.length < 2 && (
                                <div className="edit-lobby-tag-warning">Minimum 2 tags required</div>
                            )}
                        </>
                    ) : (
                        <span className="edit-lobby-section-note">Community Ice Breaker — no matching categories</span>
                    )}
                </div>

                {/* Table Numbers Section */}
                <div className="edit-lobby-section">
                    <label className="edit-lobby-checkbox-row">
                        <span className="edit-lobby-section-label" style={{ marginBottom: 0 }}>Table Numbers</span>
                        <input
                            type="checkbox"
                            checked={editShowTableNumbers}
                            onChange={(e) => setEditShowTableNumbers(e.target.checked)}
                            className="edit-lobby-checkbox"
                        />
                    </label>
                </div>

                {/* Round Duration Section */}
                <div className={`edit-lobby-section ${lobbyState !== 'checkin' ? 'edit-lobby-section-disabled' : ''}`}>
                    <span className="edit-lobby-section-label">Round Duration</span>
                    {lobbyState === 'checkin' ? (
                        <div className="edit-lobby-duration-row">
                            <div className="edit-lobby-duration-group">
                                <input
                                    type="number"
                                    value={editMinutes}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        if (value === '' || (parseInt(value) > 0 && parseInt(value) <= MaxMinutes)) {
                                            setEditMinutes(value);
                                            if (parseInt(value) === MaxMinutes) setEditSeconds('0');
                                        }
                                    }}
                                    min="1"
                                    max={MaxMinutes}
                                    className="edit-lobby-duration-input"
                                    autoComplete="off"
                                />
                                <label className="edit-lobby-duration-label">Minutes</label>
                            </div>
                            <div className="edit-lobby-duration-group">
                                <input
                                    type="number"
                                    value={editSeconds}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        if (value === '' || (parseInt(value) >= 0 && parseInt(value) <= 59)) {
                                            setEditSeconds(value);
                                        }
                                    }}
                                    min="0"
                                    max="59"
                                    className="edit-lobby-duration-input"
                                    autoComplete="off"
                                    disabled={parseInt(editMinutes) === MaxMinutes}
                                />
                                <label className="edit-lobby-duration-label">Seconds</label>
                            </div>
                        </div>
                    ) : (
                        <span className="edit-lobby-section-note">
                            {Math.floor((currentRoundDuration || 300) / 60)}m {Math.floor((currentRoundDuration || 300) % 60)}s — can only be changed before rounds start
                        </span>
                    )}
                </div>

                {/* Logo Section */}
                <div className="edit-lobby-section">
                    <span className="edit-lobby-section-label">Sponsor Logo</span>
                    {logoLoading ? (
                        <div className="edit-lobby-logo-loading">Loading...</div>
                    ) : (
                        <>
                            {currentLogoDisplay && !isLogoCropping && (
                                <div className="edit-lobby-logo-preview">
                                    <img src={currentLogoDisplay} alt="Logo preview" className="edit-lobby-logo-img" />
                                    <button type="button" onClick={handleRemoveLogo} className="edit-lobby-logo-remove">×</button>
                                </div>
                            )}
                            {!currentLogoDisplay && !isLogoCropping && (
                                <>
                                    {isLogoProcessing ? (
                                        <div className="edit-lobby-logo-loading">Processing...</div>
                                    ) : (
                                        <>
                                            <input type="file" id="editLogoUpload" accept="image/jpeg,image/jpg,image/png"
                                                onChange={handleLogoUpload} style={{ display: 'none' }} />
                                            <button type="button"
                                                onClick={() => document.getElementById('editLogoUpload').click()}
                                                className="edit-lobby-logo-upload-btn">
                                                Upload Logo
                                            </button>
                                        </>
                                    )}
                                </>
                            )}
                            {isLogoCropping && logoPreview && (
                                <div className="edit-lobby-crop-container">
                                    <div className="edit-lobby-crop-area">
                                        <Cropper image={logoPreview} crop={logoCrop} zoom={logoZoom} aspect={1}
                                            onCropChange={setLogoCrop} onZoomChange={setLogoZoom}
                                            onCropComplete={handleLogoCropComplete} />
                                    </div>
                                    <div className="edit-lobby-crop-controls">
                                        <button type="button" onClick={handleSaveLogoCrop}
                                            className="edit-lobby-crop-save" disabled={isLogoProcessing}>
                                            {isLogoProcessing ? 'Processing...' : 'Save Crop'}
                                        </button>
                                        <button type="button" onClick={handleRemoveLogo}
                                            className="edit-lobby-crop-cancel">Cancel</button>
                                    </div>
                                </div>
                            )}
                            {logoError && <div className="edit-lobby-logo-error">{logoError}</div>}
                        </>
                    )}
                </div>

                {error && <div className="edit-lobby-error">{error}</div>}

                <div className="edit-lobby-actions">
                    <button className="edit-lobby-btn-cancel" onClick={onClose} disabled={isSaving}>Cancel</button>
                    <button className="edit-lobby-btn-save" onClick={handleSave} disabled={isSaving || (hasTags && editTags.length < 2)}>
                        {isSaving ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const AdminLobbyView = () => {
    const { user, userProfile, checkAuth, permissions, isLegacyOrganizer, isAuthLoading } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();
    const DEVMODE = false;

    const [planInfo, setPlanInfo] = useState(null);
    const didFetchPlanInfoRef = useRef(false);

    // Attendee Limit Warning Modal state
    const [showLimitWarningModal, setShowLimitWarningModal] = useState(false);
    const [inactivePlayerCount, setInactivePlayerCount] = useState(0);

    useEffect(() => {
        if (didFetchPlanInfoRef.current) return;
        if (isAuthLoading) return;
        if (permissions === 'admin' || isLegacyOrganizer) return;
        didFetchPlanInfoRef.current = true;

        const fetchPlanInfo = async () => {
            try {
                const res = await apiFetch('/organizer-plan-details');
                const data = await res.json();
                if (data.has_plan) {
                    setPlanInfo(data);
                }
            } catch (err) {
                console.error('Failed to fetch plan info:', err);
            }
        };
        fetchPlanInfo();
    }, [permissions, isLegacyOrganizer, isAuthLoading]);
    
    // Audio sound feature - same as lobby.jsx
    const playat = Math.floor(9*60); // 540 seconds (9 minutes)
    const { audioRef, error, playSound, loadSound, seekTo, cancelSound, checkSound, soundEnabled, setSoundEnabled, isPlaying } = usePlaySound();
    const [showSoundPrompt, setShowSoundPrompt] = useState(true);
    const [isPageVisible, setIsPageVisible] = useState(!document.hidden);
    const roundPosition = useRef(null);
    const checkinTriggerRef = useRef(null);
    
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
    const [showTableNumbers, setShowTableNumbers] = useState(false);
    const [maxActiveRound, setMaxActiveRound] = useState(0);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [tutorialMode, setTutorialMode] = useState(false);
    const [showCheckinTutorial, setShowCheckinTutorial] = useState(false);
    const [showStartTutorial, setShowStartTutorial] = useState(false);
    const startModalTriggerRef = useRef(null);
    const [showEndTutorial, setShowEndTutorial] = useState(false);
    const endModalTriggerRef = useRef(null);
    const [inlineQrCopied, setInlineQrCopied] = useState(false);
    const [inlineQrPulsing, setInlineQrPulsing] = useState(false);

    // Add playerCount and lobbyState for progress bar
    const playerCount = (lobbyData?.length || 0) + (pairedPlayers?.length * 2 || 0);
    const totalAttendeeCount = playerCount + inactivePlayerCount;
    const isQrState = lobbyState === 'checkin' && playerCount < 2;

    // 90% attendee limit warning -- show once per lobby via sessionStorage
    useEffect(() => {
        if (showLimitWarningModal) return;
        if (!planInfo?.attendee_limit || !lobbyCode || lobbyCode === 'test') return;
        const storageKey = `limitWarning_${lobbyCode}`;
        if (sessionStorage.getItem(storageKey)) return;
        const threshold = Math.floor(planInfo.attendee_limit * 0.9);
        if (playerCount >= threshold) {
            setShowLimitWarningModal(true);
            sessionStorage.setItem(storageKey, 'true');
        }
    }, [playerCount, planInfo, lobbyCode, showLimitWarningModal]);

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

    // Cleanup audio and reset limit warning flag when lobby becomes inactive or terminated
    useEffect(() => {
        if (lobbyState === "terminated" || lobbyState === "inactive") {
            cancelSound();
            if (lobbyCode && lobbyCode !== 'test') {
                sessionStorage.removeItem(`limitWarning_${lobbyCode}`);
            }
        }
    }, [lobbyState, lobbyCode]);

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
                        setCustomTags(data.custom_tags || []);
                        setShowTableNumbers(data.show_table_numbers ?? false);
                        setInactivePlayerCount(data.inactive_player_count || 0);
                    } else {
                        console.error("Invalid lobby data structure:", data);
                        setLobbyData([]);
                        setPairedPlayers([]);
                    }
                } else if (response.status === 403) {
                    clearInterval(interval);
                    navigate('/');
                    return;
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

    // Forward live-lobby context so /organizer-account-details (and downstream
    // /plan-selection) can carry lobbyCode through the upgrade flow. This keeps
    // _update_lobby_max_attendees firing after a mid-lobby plan change.
    const goToAccountDetails = (extraState = {}) =>
        navigate('/organizer-account-details', {
            state: {
                lobbyCode,
                fromActiveLobby: true,
                lobbyState,
                ...extraState,
            },
        });

    // Handlers for progress bar actions
    const handleStartRounds = async () => {
        try {
            const response = await apiFetch('/start_rounds', {
                method: 'GET',
                headers: {
                    'lobby_code': lobbyCode
                }
            });
            const data = await response.json();
            if (data.status === 'success') {
                toast.success('Rounds started!', { position: 'top-center' });
            } else {
                if (data.reason === 'activations_exhausted' || data.reason === 'monthly_limit_reached' || data.reason === 'no_uses_remaining') {
                    goToAccountDetails({ limitMessage: data.message });
                } else {
                    toast.error(data.message || 'Failed to start rounds', { position: 'top-center' });
                }
            }
        } catch (err) {
            console.error('Error starting rounds:', err);
            toast.error('Failed to start rounds', { position: 'top-center' });
        }
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
            navigate('/organizer-dashboard');
        }
    };

    const handleInlineQrDownload = () => {
        const svg = document.getElementById('inline-qr-svg');
        if (!svg) return;
        generateStyledQRCodeImage(svg, lobbyCode)
            .then((blob) => {
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `reuneo-lobby-${lobbyCode}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                setInlineQrCopied(true);
                setTimeout(() => setInlineQrCopied(false), 800);
                if (navigator.clipboard && navigator.clipboard.write) {
                    navigator.clipboard.write([
                        new window.ClipboardItem({ "image/png": blob })
                    ]).catch(() => {});
                }
            })
            .catch((err) => console.error('Error generating QR code image:', err));
    };

    return (
        <>
            {/* Toast container for react-hot-toast */}
            <Toaster position="top-center" />
            <AttendeeLimitWarningModal
                isOpen={showLimitWarningModal}
                onClose={() => setShowLimitWarningModal(false)}
                playerCount={playerCount}
                attendeeLimit={planInfo?.attendee_limit || 0}
                onUpgrade={() => {
                    setShowLimitWarningModal(false);
                    goToAccountDetails();
                }}
            />
            <div className={`admin-lobby-container${isQrState ? ' admin-lobby-qr-state' : ''}`}>
                {DEVMODE && (
                    <button onClick={resetLobbyTimer}>
                        Reset Lobby Timer
                    </button>
                )}
                <div className="admin-view-nav-bar" style={tutorialMode ? { zIndex: 10001, background: '#f8f9fb' } : undefined}>
                    <button className="admin-nav-back" onClick={() => navigate('/')} aria-label="Back">
                        <svg width="28" height="28" viewBox="0 0 36 36" fill="none">
                            <circle cx="18" cy="18" r="17" stroke="#374151" strokeWidth="1.5" fill="rgba(255,255,255,0.8)"/>
                            <path d="M21 12L15 18L21 24" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </button>
                    <img 
                        src="/assets/reuneo_test_14.png"
                        alt="Reuneo Logo"
                        className="admin-view-logo-img"
                    />
                    <div
                        className={`tutorial-toggle ${tutorialMode ? 'tutorial-toggle-on' : ''}`}
                        onClick={() => setTutorialMode(prev => !prev)}
                        role="switch"
                        aria-checked={tutorialMode}
                        aria-label="Tutorial mode"
                    >
                        <span className="tutorial-toggle-knob" />
                        <span className="tutorial-toggle-label">
                            {tutorialMode ? 'Tutorial On' : 'Tutorial Off'}
                        </span>
                    </div>
                </div>
                {tutorialMode && (
                    <AdminCheckinTutorialFull
                        isVisible={tutorialMode}
                        onComplete={() => setTutorialMode(false)}
                        customTags={customTags}
                        showTableNumbers={showTableNumbers}
                    />
                )}
                {showCheckinTutorial && (
                    <AdminCheckinTutorialFull
                        isVisible={showCheckinTutorial}
                        onComplete={() => setShowCheckinTutorial(false)}
                        customTags={customTags}
                        showTableNumbers={showTableNumbers}
                        stopAfterReady
                        showSkip
                    />
                )}
                {showStartTutorial && (
                    <AdminCheckinTutorialFull
                        isVisible={showStartTutorial}
                        onComplete={() => {
                            setShowStartTutorial(false);
                            startModalTriggerRef.current?.();
                        }}
                        customTags={customTags}
                        showTableNumbers={showTableNumbers}
                        startFromScene={11}
                        stopBeforeEnd
                        showSkip
                    />
                )}
                {showEndTutorial && (
                    <AdminCheckinTutorialFull
                        isVisible={showEndTutorial}
                        onComplete={() => {
                            setShowEndTutorial(false);
                            endModalTriggerRef.current?.();
                        }}
                        customTags={customTags}
                        showTableNumbers={showTableNumbers}
                        startFromScene={17}
                        showSkip
                    />
                )}
                {isQrState ? (
                    <>
                        {/* QR state: QR section first, then profile list, then progress bar */}
                        <div className="inline-checkin-content">
                            <h2 className="checkin-modal-title">Real People. Real Connections.</h2>
                            <p className="checkin-modal-subtitle">
                                Tell people to scan and listen to the app's instructions. Thats it!
                            </p>
                            <div className="checkin-modal-qr-wrapper" style={{ marginTop: '0.75rem' }} onClick={() => {
                                setInlineQrPulsing(true);
                                setTimeout(() => setInlineQrPulsing(false), 700);
                                handleInlineQrDownload();
                                setTimeout(() => setShowCheckinTutorial(true), 100);
                            }}>
                                <div className="inline-qr-pulse-container">
                                    <div className="checkin-modal-qr-card inline-qr-active">
                                        <QRCodeSVG
                                            value={`${window.location.origin}/lobby?code=${lobbyCode}`}
                                            size={180}
                                            level="H"
                                            includeMargin={false}
                                            bgColor="#ffffff"
                                            fgColor="#1a1a2e"
                                            id="inline-qr-svg"
                                        />
                                        <div className="checkin-modal-qr-download-hint inline-qr-hint-active">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                <polyline points="7 10 12 15 17 10" />
                                                <line x1="12" y1="15" x2="12" y2="3" />
                                            </svg>
                                            <span>{inlineQrCopied ? 'Saved!' : 'Tap to save/print'}</span>
                                        </div>
                                    </div>
                                    {/* ambient always-on pulse rings */}
                                    <span className="inline-qr-ring inline-qr-ambient-ring-1" />
                                    <span className="inline-qr-ring inline-qr-ambient-ring-2" />
                                    {/* click-burst rings */}
                                    {inlineQrPulsing && (
                                        <>
                                            <span className="inline-qr-ring inline-qr-ring-1" />
                                            <span className="inline-qr-ring inline-qr-ring-2" />
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        <OverlappingProfileList
                            players={{ pairedPlayers, lobbyData }}
                            totalAttendeeCount={playerCount}
                            attendeeLimit={planInfo?.attendee_limit || null}
                            lobbyState={lobbyState}
                            planType={planInfo?.plan_type}
                            onUpgrade={planInfo ? () => goToAccountDetails() : null}
                        />

                        <LobbyProgressBar
                            lobbyState={lobbyState}
                            playerCount={playerCount}
                            onStart={handleStartRounds}
                            onEnd={handleEndRounds}
                            lobbyCode={lobbyCode}
                            currentRound={maxActiveRound}
                            checkinTriggerRef={checkinTriggerRef}
                            suppressCheckinAutoOpen={false}
                            planInfo={planInfo}
                            showStartPulse={lobbyState === 'checkin' && playerCount >= 2}
                            onStartTutorial={() => setShowStartTutorial(true)}
                            startModalTriggerRef={startModalTriggerRef}
                            showEndPulse={lobbyState === 'active' && maxActiveRound >= 4}
                            onEndTutorial={() => setShowEndTutorial(true)}
                            endModalTriggerRef={endModalTriggerRef}
                        />
                    </>
                ) : (
                    <>
                        {/* Default order: progress bar then profile list */}
                        <LobbyProgressBar
                            lobbyState={lobbyState}
                            playerCount={playerCount}
                            onStart={handleStartRounds}
                            onEnd={handleEndRounds}
                            lobbyCode={lobbyCode}
                            currentRound={maxActiveRound}
                            checkinTriggerRef={checkinTriggerRef}
                            suppressCheckinAutoOpen={false}
                            planInfo={planInfo}
                            showStartPulse={lobbyState === 'checkin' && playerCount >= 2}
                            onStartTutorial={() => setShowStartTutorial(true)}
                            startModalTriggerRef={startModalTriggerRef}
                            showEndPulse={lobbyState === 'active' && maxActiveRound >= 4}
                            onEndTutorial={() => setShowEndTutorial(true)}
                            endModalTriggerRef={endModalTriggerRef}
                        />

                        <OverlappingProfileList
                            players={{ pairedPlayers, lobbyData }}
                            totalAttendeeCount={playerCount}
                            attendeeLimit={planInfo?.attendee_limit || null}
                            lobbyState={lobbyState}
                            planType={planInfo?.plan_type}
                            onUpgrade={planInfo ? () => goToAccountDetails() : null}
                        />
                    </>
                )}

                {/* Attendee QR button — hidden only when inline QR is visible (checkin + <2 players) */}
                {!(lobbyState === 'checkin' && playerCount < 2) && (
                    <div
                        className="admin-lobby-dropdown-toggle attendee-qr-btn"
                        onClick={() => checkinTriggerRef.current?.()}
                    >
                        Attendee QR
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '8px' }}>
                            <rect x="2" y="2" width="8" height="8" rx="1" />
                            <rect x="14" y="2" width="8" height="8" rx="1" />
                            <rect x="2" y="14" width="8" height="8" rx="1" />
                            <rect x="14" y="14" width="4" height="4" rx="0.5" />
                            <line x1="22" y1="14" x2="22" y2="18" />
                            <line x1="18" y1="22" x2="22" y2="22" />
                            <line x1="14" y1="22" x2="14" y2="22" />
                        </svg>
                    </div>
                )}
                
                {/* Dropdown Toggle Bar/Header */}
                <div
                    className={`admin-lobby-dropdown-toggle ${showLobbyDetails ? 'expanded' : ''}`}
                    onClick={() => setShowLobbyDetails((prev) => !prev)}
                >
                    {showLobbyDetails ? (
                        <>
                            Hide Controls
                            <span className="dropdown-chevron rotated">▼</span>
                        </>
                    ) : (
                            <>
                                Settings
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '8px', opacity: 0.9 }}>
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                </svg>
                            </>
                    )}
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
                    <div className="admin-lobby-event-settings">
                        
                        <div className="admin-profile">
                            <img 
                                src={userProfile?.image_data ? `data:image/jpeg;base64,${userProfile.image_data}` : "/assets/player_icon_trans.png"} 
                                alt="Your Profile" 
                                className="admin-profile-picture"
                            />
                            <div className="admin-profile-name-group">
                                <span className="admin-profile-name">
                                    {userProfile?.name ? userProfile.name.slice(0, 20) : user?.slice(0, 20)}
                                </span>
                                <span className="admin-profile-role">(organizer)</span>
                            </div>
                        </div>
                        <span className="settings-section-label">Lobby Details:</span>
                        <div className="setting-item">
                            <span className="setting-label">Round Duration: <span className="setting-value">{Math.floor(roundDuration / 60)} min</span></span>
                            <span className="setting-label">Tags: <span className="setting-value">{customTags?.length || 0}</span></span>

                            {customTags && customTags.length > 0 && (
                                <AdminTagsScrollList tags={customTags} />
                            )}
                        </div>
                        <button
                            onClick={() => setIsEditModalOpen(true)}
                            className="page-control-button page-control-join"
                        >
                            Edit Lobby
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '6px', flexShrink: 0 }}>
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                        </button>
                        {planInfo && (
                            <button
                                onClick={() => goToAccountDetails()}
                                className={`page-control-button ${planInfo.plan_type === 'free_trial' ? 'page-control-join' : 'page-control-secondary'}`}
                            >
                                {planInfo.plan_type === 'free_trial' ? 'Upgrade Plan' : 'Plan Details'}
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '6px', flexShrink: 0 }}>
                                    <path d="M12 19V5"/>
                                    <path d="M5 12l7-7 7 7"/>
                                </svg>
                            </button>
                        )}
                        <button
                            onClick={handleOpenJoinModal}
                            className="page-control-button page-control-secondary"
                        >
                            Join Lobby
                        </button>
                        
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
                {lobbyState !== 'checkin' && (
                    <div className="admin-stats-timer-row">
                        {lobbyState !== 'interrim' && (
                            <div className="admin-stats-text">
                                <div className="admin-stats-text-row">
                                    <span className="admin-stats-label">Paired</span>
                                    <span className="admin-stats-value">{pairedPlayers?.length * 2 || 0}</span>
                                </div>
                                <div className="admin-stats-text-row">
                                    <span className="admin-stats-label">Unpaired</span>
                                    <span className="admin-stats-value">{lobbyData?.length || 0}</span>
                                </div>
                                <div className="admin-stats-text-row">
                                    <span className="admin-stats-label">Total</span>
                                    <span className="admin-stats-value">{(lobbyData?.length || 0) + (pairedPlayers?.length * 2 || 0)}</span>
                                </div>
                            </div>
                        )}
                        {(lobbyState === "active" || lobbyState === "interrim") && lobbyTimer && (
                            <div className="admin-stats-timer">
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
                        )}
                    </div>
                )}
                
                {pairedPlayers && pairedPlayers.length > 0 && lobbyState !== 'checkin' && (
                    <div className="admin-lobby-players">
                        <div className="player-section">
                            {lobbyState === 'interrim' ? (
                                <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem 0' }}>
                                    <LoadingSpinner size={36} message="Pairing up..." />
                                </div>
                            ) : (
                            <>
                            <div className="section-header">Paired Players: <span className="section-header-count">{pairedPlayers?.length * 2 || 0}</span></div>
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
                                                {pair[0].eligible_for_pairing === false && (
                                                    <span className="eligibility-badge not-eligible">Not ready</span>
                                                )}
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
                                                {pair[1].eligible_for_pairing === false && (
                                                    <span className="eligibility-badge not-eligible">Not ready</span>
                                                )}
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
                            </>
                            )}
                        </div>
                    </div>
                )}

                {lobbyData && lobbyData.length > 0 && (
                    <div className="admin-lobby-players">
                        <div className="player-section">
                            {lobbyState === 'interrim' ? (
                                <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem 0' }}>
                                    <LoadingSpinner size={36} message="Assigning..." />
                                </div>
                            ) : (
                            <>
                            <div className="section-header">{lobbyState === 'checkin' ? 'People Checked In' : 'Unpaired Players'}: <span className="section-header-count">{lobbyData?.length || 0}</span></div>
                            <div className="player-grid">
                                {[...lobbyData].sort((a, b) => (a.eligible_for_pairing === false ? 0 : 1) - (b.eligible_for_pairing === false ? 0 : 1)).map((player, index) => (
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
                                        {player.eligible_for_pairing === false && (
                                            <span className="eligibility-badge not-eligible">Not ready</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                            </>
                            )}
                        </div>
                    </div>
                )}

                {/* Join Confirmation Modal */}
                <JoinConfirmationModal 
                    isOpen={isJoinModalOpen}
                    onClose={handleCloseJoinModal}
                    onConfirm={handleJoinLobby}
                    userProfile={userProfile}
                />

                {/* Kick Confirmation Modal */}
                <KickConfirmationModal 
                    isOpen={isKickModalOpen}
                    onClose={handleCloseKickModal}
                    onConfirm={handleKickUser}
                    userName={selectedUser?.name || "this user"}
                    userImage={selectedUser?.pfp_data}
                />

                {/* Edit Lobby Modal */}
                <EditLobbyModal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    lobbyCode={lobbyCode}
                    currentTags={customTags}
                    currentShowTableNumbers={showTableNumbers}
                    currentRoundDuration={roundDuration}
                    lobbyState={lobbyState}
                />
            </div>

            {/* Sound Prompt - same conditional rendering as lobby.jsx */}
            {(soundEnabled || !showSoundPrompt) || (lobbyState == "checkin") || (lobbyState == null) || isPlaying ? null : <SoundPrompt onEnable={() => { loadSound(); setShowSoundPrompt(false); }} onDismiss={() => setShowSoundPrompt(false)} />}
        </>
    );
}

export default AdminLobbyView;