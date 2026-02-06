// const asset_path="project/dist/assets/";
import React, { useState, useRef, useEffect, useContext } from 'react';
import ProfileCreation from './core/profile_creation';
import usePlaySound from './core/playsound';
import AuthProvider from './core/Auth/AuthContext';
import { AuthContext } from './core/Auth/AuthContext';
import './App.css';
import { apiFetch } from './core/utils/api';
import { Html5QrcodeScanner } from 'html5-qrcode';

import LoginSignupLogoutButton from './core/Auth/LoginSignupLogoutButton';
import PureSignupPage from './core/Auth/PureSignupPage';
import { CommunityPageButton } from './core/community/mycf';

import useGetLobbyMetadata from './core/lobby/get_lobby_metadata';
import { getStoredLobbyCode, shouldValidateLobby, markLobbyValidated, clearLobbyStorage } from './core/utils/lobbyStorage';

import { useNavigate } from 'react-router-dom';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
// import CreateLobbyButton from './core/lobby/CreateLobbyButton';
// import CreateLobby from './core/lobby/create_lobby';
// import './core/lobby/create_lobby.css';

/* Inline icons for dock (Join Lobby: people/high-five, Login: arrow into line) */
const JoinLobbyIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    <path d="M12 11v6" />
    <path d="M9 14h6" />
  </svg>
);
const LoginIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
    <polyline points="10 17 15 12 10 7" />
    <line x1="15" y1="12" x2="3" y2="12" />
  </svg>
);
const Sparkle4pt = ({ cx, cy, r, className }) => (
  <path
    className={className}
    d={`M${cx} ${cy - r} C${cx + r * 0.1} ${cy - r * 0.1} ${cx + r * 0.1} ${cy - r * 0.1} ${cx + r} ${cy} C${cx + r * 0.1} ${cy + r * 0.1} ${cx + r * 0.1} ${cy + r * 0.1} ${cx} ${cy + r} C${cx - r * 0.1} ${cy + r * 0.1} ${cx - r * 0.1} ${cy + r * 0.1} ${cx - r} ${cy} C${cx - r * 0.1} ${cy - r * 0.1} ${cx - r * 0.1} ${cy - r * 0.1} ${cx} ${cy - r}Z`}
  />
);
const ProfileIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);
const LogoutIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden style={{ transform: 'scaleX(-1)' }}>
    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
    <polyline points="10 17 15 12 10 7" />
    <line x1="15" y1="12" x2="3" y2="12" />
  </svg>
);
const OrganizerIcon = () => (
  <svg width="24" height="24" viewBox="0 0 32 32" fill="currentColor" aria-hidden>
    <Sparkle4pt cx={12} cy={12} r={12.5} />
    <Sparkle4pt cx={26} cy={25} r={7} />
    <Sparkle4pt cx={27} cy={6} r={4} />
  </svg>
);

function AppDockItem({ children, onClick, disabled, mouseX, spring, distance, magnification, baseItemSize, ariaLabel, title }) {
  const ref = useRef(null);
  const mouseDistance = useTransform(mouseX, (val) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return distance + 1; /* map to baseItemSize when ref not ready */
    return val - rect.x - rect.width / 2;
  });
  const targetSize = useTransform(mouseDistance, [-distance, 0, distance], [baseItemSize, magnification, baseItemSize]);
  const size = useSpring(targetSize, spring);
  return (
    <motion.div
      ref={ref}
      style={{ width: size, height: size, minWidth: baseItemSize, minHeight: baseItemSize }}
      onClick={disabled ? undefined : onClick}
      onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !disabled) { e.preventDefault(); onClick?.(); } }}
      className="app-dock-item"
      tabIndex={disabled ? -1 : 0}
      role="button"
      aria-disabled={!!disabled}
      aria-label={ariaLabel}
      title={title}
    >
      {children}
    </motion.div>
  );
}

const DOCK_SPRING = { mass: 0.1, stiffness: 150, damping: 12 };

function AppDock({ items, panelHeight = 68, baseItemSize = 50, magnification = 58, distance = 200 }) {
  const mouseX = useMotionValue(Infinity);
  return (
    <div className="app-dock-outer">
      <motion.div
        className="app-dock-panel"
        style={{ minHeight: panelHeight }}
        role="toolbar"
        aria-label="Application dock"
        onMouseMove={({ pageX }) => mouseX.set(pageX)}
        onMouseLeave={() => mouseX.set(Infinity)}
      >
        {items.map((item, index) => (
          <AppDockItem
            key={index}
            onClick={item.onClick}
            disabled={item.disabled}
            mouseX={mouseX}
            spring={DOCK_SPRING}
            distance={distance}
            magnification={magnification}
            baseItemSize={baseItemSize}
            ariaLabel={item.label}
            title={item.title}
          >
            <div className="app-dock-icon">{item.icon}</div>
            <span className="app-dock-label">{item.label}</span>
          </AppDockItem>
        ))}
      </motion.div>
    </div>
  );
}

const App = () => {
  const [showProfileCreation, setShowProfileCreation] = useState(false);
  const [showLobbyCodeModal, setShowLobbyCodeModal] = useState(false);
  const [lobbyCodeInput, setLobbyCodeInput] = useState('');
  const [lobbyCodeError, setLobbyCodeError] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [profileData, handleProfileSubmit] = useState(null);
  const { audioRef, error, playSound, loadSound, cancelSound } = usePlaySound();
  const { user, userProfile, checkAuth, permissions, emailVerified } = useContext(AuthContext);

  const [player_count, setPlayerCount] = useState(null);
  const [lobby_state, setLobbyState] = useState(null);
  const [activeLobbies, setActiveLobbies] = useState([]);
  const [isLoadingLobbies, setIsLoadingLobbies] = useState(false);
  const [userCurrentLobby, setUserCurrentLobby] = useState(null);
  const [showQRInstructionModal, setShowQRInstructionModal] = useState(false);

  const navigate = useNavigate();
  useGetLobbyMetadata(setPlayerCount, setLobbyState);

  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef(null);
  const scannerRef = useRef(null);

  // Function to fetch and redirect to admin's active lobby
  const redirectToAdminLobby = async () => {
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
          
          // Redirect to admin lobby view with the lobby code
          navigate(`/admin_lobby_view?code=${lobbyCode}`);
        } else {
          // If no active lobby found, just navigate to the admin lobby view page
          navigate('/admin_lobby_view');
        }
      } else {
        console.error("Failed to fetch active lobby");
        navigate('/admin_lobby_view');
      }
    } catch (error) {
      console.error("Error fetching active lobby:", error);
      navigate('/admin_lobby_view');
    }
  };

  // Function to check and validate user's current lobby from localStorage
  const checkUserCurrentLobby = async (forceValidation = false) => {
    const storedLobbyCode = getStoredLobbyCode();
    if (!storedLobbyCode || !user) {
      setUserCurrentLobby(null);
      return;
    }

    // Show immediately (optimistic UI)
    setUserCurrentLobby(storedLobbyCode);

    // Always validate on home page load, or validate in background if cache expired
    if (forceValidation || shouldValidateLobby()) {
      try {
        const response = await apiFetch(`/display_lobby_metadata?lobby_code=${storedLobbyCode}`, {
          headers: {
            'lobby_code': storedLobbyCode
          }
        });

        if (response.ok) {
          const data = await response.json();
          // Hide if lobby is terminated/removed (API returns status: 'error' for terminated lobbies)
          if (data.status === 'error' || data.lobby_state === 'terminated') {
            clearLobbyStorage();
            setUserCurrentLobby(null);
          } else {
            // Mark as validated
            markLobbyValidated();
          }
        } else if (response.status === 404) {
          // Only clear if lobby definitively doesn't exist (404)
          // For other errors (401, 500, etc.), keep the tile visible
          clearLobbyStorage();
          setUserCurrentLobby(null);
        }
      } catch (error) {
        console.error("Error validating current lobby:", error);
        // On network error, keep showing the tile - only hide if explicitly terminated
        // The lobby page will handle any connection issues when user clicks
      }
    }
  };

  // Function to fetch user's active lobbies
  const fetchActiveLobbies = async () => {
    if (!user) return;
    
    setIsLoadingLobbies(true);
    try {
      const response = await apiFetch('/view_my_active_lobbies');
      
      if (response.ok) {
        const data = await response.json();
        console.log("User's active lobbies:", data);
        
        if (data && data.lobbies && Array.isArray(data.lobbies)) {
          setActiveLobbies(data.lobbies);
        } else {
          setActiveLobbies([]);
        }
      } else {
        console.error("Failed to fetch user's active lobbies");
        setActiveLobbies([]);
      }
    } catch (error) {
      console.error("Error fetching user's active lobbies:", error);
      setActiveLobbies([]);
    } finally {
      setIsLoadingLobbies(false);
    }
  };

  // Fetch active lobbies when user is authenticated
  useEffect(() => {
    if (user) {
      fetchActiveLobbies();
      checkUserCurrentLobby(true); // Force validation on home page load
    } else {
      setUserCurrentLobby(null);
    }
  }, [user]);

  // const handleProfileSubmit = (profileData) => {
  //   // Here you would typically send the data to your server
  //   setUserProfile(profileData);
  //   setShowProfileCreation(false); 
  // };

  useEffect(() => {
    checkAuth();
  }, []);

  // Check for showLobbyModal query parameter and open the modal if present
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const showLobbyModal = searchParams.get('showLobbyModal');
    
    if (showLobbyModal === 'true' && user) {
      setShowLobbyCodeModal(true);
      // Remove the query parameter from the URL without refreshing the page
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [user]);

  // Function to navigate to a specific lobby
  const navigateToAdminLobby = (lobbyCode) => {
    if (permissions === 'admin' || permissions === 'organizer') {
      navigate(`/admin_lobby_view?code=${lobbyCode}`);
    } 
  };

  // Function to handle lobby code submission
  const handleJoinLobby = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const name = formData.get('name');
    
    // Validate input - only allow alphanumeric characters
    if (!name || name.trim() === '') {
      setLobbyCodeError('Please enter a lobby code');
      return;
    }
    
    // Convert to lowercase and remove any non-alphanumeric characters
    const sanitizedCode = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    if (sanitizedCode === '') {
      setLobbyCodeError('Lobby code must contain only letters and numbers');
      return;
    }
    
    setNameInput(sanitizedCode);
    setShowLobbyCodeModal(false);
    console.log(sanitizedCode);
    setLobbyCodeInput(sanitizedCode);
    navigate(`/lobby?code=${sanitizedCode}`);
    setLobbyCodeInput('');
    setLobbyCodeError('');
  };

  // Function to handle QR code scanning
  const handleScanQRCode = () => {
    setIsScanning(true);
    
    // We need to wait for the DOM to update before initializing the scanner
    setTimeout(() => {
      // Check if the element exists
      const qrReaderElement = document.getElementById("qr-reader");
      if (!qrReaderElement) {
        console.error("QR reader element not found");
        setIsScanning(false);
        return;
      }
      
      // Create a new scanner instance
      const scanner = new Html5QrcodeScanner(
        "qr-reader", 
        { 
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          showTorchButtonIfSupported: true,
          showZoomSliderIfSupported: true,
          // verbose: false, // Disable verbose logging
          disableFlip: false,
          rememberLastUsedCamera: true,
          showScanButton: false, // Hide the scan button
          showStopButton: false, // Hide the stop button
        },
        false
      );
      
      scannerRef.current = scanner;
      
      // Start scanning
      scanner.render(onScanSuccess, onScanFailure);
      
      // Add custom CSS to hide the stop scanning button, its part the html5-qrcode library
      setTimeout(() => {
        // Find all buttons in the dashboard
        const buttons = document.querySelectorAll('#qr-reader__dashboard button');
        // The stop button is typically the last one
        if (buttons.length > 0) {
          const stopButton = buttons[buttons.length - 1];
          stopButton.style.display = 'none';
        }
      }, 500); // Increased timeout to ensure the scanner is fully initialized
    }, 100); // Small delay to ensure DOM is updated
  };
  
  // Function to handle successful QR code scan
  const onScanSuccess = (decodedText) => {
    // Stop the scanner
    stopScanning();
    
    // Simply navigate to the URL in the QR code
    // The phone's browser will handle the URL
    window.location.href = decodedText;
  };
  
  // Function to handle scan failure
  const onScanFailure = (error) => {
    // Only log critical errors, ignore common scanning errors
    if (error && error.includes && (
      error.includes("No MultiFormat Readers") || 
      error.includes("No MultiFormat Readers") ||
      error.includes("No MultiFormat Readers")
    )) {
      console.warn(`QR code scanning error: ${error}`); 
    }
  };

  // Function to stop scanning
  const stopScanning = () => {
    setIsScanning(false);
    if (scannerRef.current) {
      scannerRef.current.clear();
      scannerRef.current = null;
    }
  };

  // LobbyCodeModal Component - Updated Design
  const LobbyCodeModal = () => {
    if (!showLobbyCodeModal) return null;

    const handleClose = () => {
      setShowLobbyCodeModal(false);
      setLobbyCodeInput('');
      setLobbyCodeError('');
      stopScanning();
    };

    return (
      <div 
        className="qr-instruction-overlay"
        onClick={handleClose}
      >
        <div 
          className="qr-instruction-container"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button 
            onClick={handleClose}
            className="qr-modal-close"
            aria-label="Close"
          >
            ×
          </button>

          {/* Heading */}
          <h2 className="qr-instruction-title">
            Enter Lobby Code
          </h2>

          {/* Body text */}
          <p className="qr-instruction-text">
            Ask your host for the lobby code if you don't have it.
          </p>

          {/* Form */}
          <form onSubmit={handleJoinLobby} className="qr-code-form">
            <div className="qr-input-container">
              <input
                type="text"
                name="name"
                placeholder="Lobby code"
                className="qr-code-input"
                pattern="[a-zA-Z0-9]+"
                title="Only letters and numbers are allowed"
                autoComplete="off"
                autoCapitalize="none"
                required
              />
              {lobbyCodeError && (
                <div className="qr-error-message">{lobbyCodeError}</div>
              )}
            </div>
            <button type="submit" className="qr-instruction-primary qr-submit-button">
              Join
            </button>
          </form>
        </div>
      </div>
    );
  };

  // QR Instruction Modal Component
  const QRInstructionModal = () => {
    if (!showQRInstructionModal) return null;

    const handleCantFindQR = () => {
      setShowQRInstructionModal(false);
      setShowLobbyCodeModal(true);
    };

    return (
      <div 
        className="qr-instruction-overlay"
        onClick={() => setShowQRInstructionModal(false)}
      >
        <div 
          className="qr-instruction-container"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button 
            onClick={() => setShowQRInstructionModal(false)}
            className="qr-modal-close"
            aria-label="Close"
          >
            ×
          </button>

          {/* QR Icon */}
          <div className="qr-instruction-icon">
            <svg 
              width="56" 
              height="56" 
              viewBox="0 0 24 24" 
              fill="none"
            >
              <defs>
                <linearGradient id="qrIconGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#144dff" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
              <rect x="3" y="3" width="7" height="7" rx="1" fill="url(#qrIconGradient)" />
              <rect x="14" y="3" width="7" height="7" rx="1" fill="url(#qrIconGradient)" />
              <rect x="3" y="14" width="7" height="7" rx="1" fill="url(#qrIconGradient)" />
              <rect x="14" y="14" width="3" height="3" rx="0.5" fill="url(#qrIconGradient)" />
              <rect x="18" y="14" width="3" height="3" rx="0.5" fill="url(#qrIconGradient)" />
              <rect x="14" y="18" width="3" height="3" rx="0.5" fill="url(#qrIconGradient)" />
              <rect x="18" y="18" width="3" height="3" rx="0.5" fill="url(#qrIconGradient)" />
            </svg>
          </div>

          {/* Heading */}
          <h2 className="qr-instruction-title">
            Open your camera app and scan the QR code provided by your host
          </h2>

          {/* Body text */}
          <p className="qr-instruction-text">
            Don't worry, the app will remember your matches if you are still logged in.
          </p>

          {/* Buttons */}
          <div className="qr-instruction-buttons">
            <button 
              className="qr-instruction-secondary"
              onClick={handleCantFindQR}
            >
              Can't find QR
            </button>
            <button 
              className="qr-instruction-primary"
              onClick={() => setShowQRInstructionModal(false)}
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ position: 'relative', height: 'var(--viewport-height)', overflow: 'hidden' }}>

      {/* <div style={{position: 'absolute', top: '40%', left: '50%', width: '100%', height: '10%', zIndex: 1000}}>
        <CommunityPageButton position="absolute" left_position="0" top_position="0"/>
      </div> */}
      
      {/* Background Video */}
      <video className="background-video" autoPlay loop muted playsInline poster="/assets/demo_app_home_video_cover.jpg">
        <source src="/assets/demo_app_home_video_X2_small.mp4" type="video/mp4" />
        <source src="/assets/app_home_video_2.webm" type="video/webm" />
        {/* Fallback for browsers that don't support video at all */}
        <img src="/assets/demo_app_home_video_cover.jpg" alt="Background fallback" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        Your browser does not support the video tag.
      </video>
      
      {/* Main App Content */}
      <div style={{ position: 'relative', zIndex: 1, color: 'white',  height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        
        <div style={{ position: 'absolute', top: '0', left: '50%', transform: 'translateX(-50%)' }}>
          <img  
            src="/assets/reuneo_test_11.png"
            alt="Logo"
            style={{width: '100px',height: '100px',objectFit: 'contain'}}
          />
        </div>

        <div style = {{marginTop: '10%',display: 'flex',flexDirection: 'column'}}>
          <LoginSignupLogoutButton 
            user={user} 
            onProfileClick={() => setShowProfileCreation(true)}
          />
          
        </div>

        {/* Settings Button - Hidden for now */}
        <div style={{ 
          position: 'absolute', 
          top: '85px', 
          display: 'none',
          justifyContent: 'flex-end',
          width: '94%',
          left: '3%',
          alignItems: 'center'
        }}>
          {(permissions === 'admin' || permissions === 'organizer') && (
            <button
              className="login-button"
              onClick={() => navigate('/organizer-account-details')}
              style={{ 
                width: '100px',
                height: '35px',
                borderRadius: '13px',
                boxShadow: '0 0 4px rgba(74, 58, 58, 0.5)',
                outline: '1px solid rgba(252, 240, 240, 0.6)',
                fontWeight: '900',
                fontSize: '1rem',
                padding: '10px 10px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(74, 58, 58, 0.7)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 0 4px rgba(74, 58, 58, 0.5)';
              }}
            >
              <span style={{
                textShadow: '0 0 1px rgba(58, 53, 53, 0.5)',
                color: 'inherit'
              }}>
                Settings
              </span>
            </button>
          )}
        </div>

        {/* Master Lobbies Button - Temporary Feature */}
        {(permissions === 'admin' || permissions === 'organizer') && user === 'topaz' && (
          <div style={{ 
            position: 'absolute', 
            top: '120px', 
            right: '20px',
            zIndex: 10
          }}>
            <button 
              className="master-lobbies-button"
              onClick={() => navigate('/master_lobby_view')}
            >
              Lobbies
            </button>
          </div>
        )}
        
        {showProfileCreation && (
          <ProfileCreation
            onSubmit={(data) => {
              setShowProfileCreation(false);
            }}
            onClose={() => setShowProfileCreation(false)}
            existingProfile={userProfile}
          />
        )}

        {/* Centered standalone button — Organizer (for non-admin/organizer) or Create Lobby (for admin/organizer with no active lobby) */}
        {permissions !== 'admin' && permissions !== 'organizer' ? (
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 10,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <div
              className="app-dock-item-standalone"
              onClick={() => window.location.href = 'https://reuneo.com/organizer-signup'}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); window.location.href = 'https://reuneo.com/organizer-signup'; } }}
              tabIndex={0}
              role="button"
              aria-label="Organizer"
            >
              <div className="app-dock-icon"><OrganizerIcon /></div>
              <span className="app-dock-label">Create</span>
            </div>
          </div>
        ) : activeLobbies.length === 0 ? (
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 10,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <div
              className="app-dock-item-standalone"
              onClick={() => navigate('/create_lobby')}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate('/create_lobby'); } }}
              tabIndex={0}
              role="button"
              aria-label="Create Lobby"
            >
              <div className="app-dock-icon"><OrganizerIcon /></div>
              <span className="app-dock-label">Create</span>
            </div>
          </div>
        ) : null}

        {/* Consolidated header - either "Pair up" or "Welcome" based on user role */}
        <div style={{ 
          position: 'absolute', 
          left: '50%', 
          width: '90%',
          maxWidth: '1200px',
          textAlign: 'center',
          marginLeft: 'auto',
          marginRight: 'auto',
          zIndex: 1,
          // Always right below the logo
          top: '130px',
          transform: 'translateX(-50%)'
        }}>
          {!user ? (
            /* Become Organizer button moved to bottom row with Join Lobby */
            null
          ) : (
            <h2 className="welcome-header" style={{ 
              color: '#ffffff',
              fontSize: '1rem',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              textShadow: '4px 4px 8px rgba(0,0,0,0.9)',
              margin: 0
            }}>
              {user && userProfile && (permissions === "admin" || permissions === "organizer") ? (
                (() => {
                  const mainText = `Create a Lobby`;
                  const nameText = userProfile ? userProfile.name.slice(0, 15) : "";
                  
                  return (
                    <>
                      {mainText.split("").map((char, index) => (
                        <span 
                          key={`main-${index}`} 
                          style={{ 
                            "--i": index + 1,
                            marginRight: char === " " ? "0.5em" : "1px"
                          }}
                        >
                          {char}
                        </span>
                      ))}
                      <br />
                      {nameText && nameText.split("").map((char, index) => (
                        <span 
                          key={`name-${index}`} 
                          style={{ 
                            "--i": index + 1,
                            marginRight: char === " " ? "0.5em" : "1px"
                          }}
                        >
                          {char}
                        </span>
                      ))}
                    </>
                  );
                })()
              ) : (
                (() => {
                  const mainText = "Join the Experience";
                  const nameText = userProfile ? userProfile.name.slice(0, 15) : "";
                  
                  return (
                    <>
                      {mainText.split("").map((char, index) => (
                        <span 
                          key={`main-${index}`} 
                          style={{ 
                            "--i": index + 1,
                            marginRight: char === " " ? "0.5em" : "1px"
                          }}
                        >
                          {char}
                        </span>
                      ))}
                      <br />
                      {nameText && nameText.split("").map((char, index) => (
                        <span 
                          key={`name-${index}`} 
                          style={{ 
                            "--i": index + 1,
                            marginRight: char === " " ? "0.5em" : "1px"
                          }}
                        >
                          {char}
                        </span>
                      ))}
                    </>
                  );
                })()
              )}
            </h2>
          )}
        </div>

        {/* Post Event Auth Button - Only for authenticated non-organizer/admin users */}
        {user && permissions !== 'admin' && permissions !== 'organizer' && (
          <div style={{ 
            position: 'absolute', 
            left: '50%', 
            transform: 'translateX(-50%)',
            width: '90%',
            maxWidth: '1200px',
            textAlign: 'center',
            marginLeft: 'auto',
            marginRight: 'auto',
            zIndex: 1,
            top: userCurrentLobby ? 'calc(32% + 200px)' : 'calc(50% + 120px)',
            transition: 'top 0.3s ease'
          }}>
            <button 
              className="primary-button join-lobby-button" 
              onClick={() => navigate(emailVerified ? '/paired-player-history' : '/post-event-auth')}
              style={{
                padding: '16px 20px',
                backgroundColor: 'transparent',
                color: 'white',
                border: 'none',
                borderRadius: '14px',
                fontWeight: '900',
                fontSize: '1.2rem',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
                transition: 'all 0.2s ease',
                width: '160px',
                margin: '0 auto',
                display: 'block',
                position: 'relative',
                zIndex: 1,
                textAlign: 'center',
                outline: 'none',
                cursor: 'pointer',
                ':hover': {
                  transform: 'scale(1.02)'
                }
              }}
            >
              <span style={{
                textShadow: '0 0 1px rgba(58, 53, 53, 0.5)',
                color: 'inherit'
              }}>
                Matches
              </span>
            </button>
          </div>
        )}

        {/* Event items, the big div */}
        <div style={{ 
            position: 'absolute',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '94%', 
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'center',
            gap: '1.5rem',
          }}>
            {/* Event item */}
            <div
              className="event-item"
              style={{
                width: 'auto',
                maxWidth: 'none',
                margin: '0',
                padding: '10px 20px',
                borderRadius: '16px',
                marginBottom: '20px',
                cursor: 'pointer',
                opacity: 1,
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: '1.5rem',
                ':hover': {
                  transform: 'translateY(-5px)'
                }
              }}
            >
              {/* Keep the commented lobby count code */}
              {/* <p
                style={{
                  margin: '0 0 15px 0',
                  color: '#4299e1',
                  fontWeight: '500',
                  fontSize: '0.9em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <span style={{
                  display: 'inline-block',
                  width: '8px',
                  height: '8px',
                  backgroundColor: '#4299e1',
                  borderRadius: '50%',
                  marginRight: '5px'
                }}></span>
                {lobby_state === 'terminate' ? 'Lobby closed' : `${player_count} in lobby`}
              </p> */}
              <div style={{ 
                display: 'flex', 
                gap: '1.5rem', 
                flexDirection: 'row',
                alignItems: 'center'
              }}>
                <AppDock
                  panelHeight={68}
                  baseItemSize={50}
                  magnification={58}
                  distance={200}
                  items={[
                    {
                      icon: <JoinLobbyIcon />,
                      label: 'Join Lobby',
                      onClick: () => setShowQRInstructionModal(true),
                      disabled: player_count === null || lobby_state === 'terminate',
                      title: (player_count === null || lobby_state === 'terminate')
                        ? (lobby_state === 'terminate' ? 'Lobby closed' : 'Lobby loading…')
                        : undefined
                    },
                    ...(!user ? [{
                      icon: <LoginIcon />,
                      label: 'Login',
                      onClick: () => navigate('/login'),
                      disabled: false
                    }] : [
                      {
                        icon: <ProfileIcon />,
                        label: 'Profile',
                        onClick: () => setShowProfileCreation(true),
                        disabled: false
                      },
                      {
                        icon: <LogoutIcon />,
                        label: 'Logout',
                        onClick: () => navigate('/logout'),
                        disabled: false
                      }
                    ])
                  ]}
                />
                {/* Create Lobby button moved to centered standalone position above */}
                {/* {(permissions === 'admin' || permissions === 'organizer') && (
                  <button 
                    className="primary-button" 
                    onClick={redirectToAdminLobby}
                    style={{
                      padding: '12px 24px',
                      backgroundColor: '#2d3748',
                      color: 'white',
                      border: 'none',
                      borderRadius: '14px',
                      fontWeight: '800',
                      transition: 'all 0.2s ease',
                      ':hover': {
                        backgroundColor: '#1a202c',
                        transform: 'scale(1.02)'
                      }
                    }}
                  >
                    <span style={{
                      textShadow: '0 0 1px rgba(58, 53, 53, 0.5)',
                      color: 'inherit'
                    }}>
                      Admin Lobby View
                    </span>
                  </button>
                )} */}
              </div>
            </div>
          </div>

        {/* User's Current Lobby Section */}
        {userCurrentLobby && !((permissions === 'admin' || permissions === 'organizer') && activeLobbies.length > 0) && (
          <div style={{ 
            position: 'absolute',
            top: 'calc(32% + 80px)',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '85%',
            maxWidth: '280px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 10,
            transition: 'all 0.3s ease'
          }}>
            <div
              onClick={() => navigate(`/lobby?code=${userCurrentLobby}`)}
              style={{
                width: '100%',
                background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.05))',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderRadius: '24px',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                padding: '16px 20px',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: '14px',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.02)';
                e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)';
                e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
                e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.25)';
              }}
            >
              {/* Animated pulse indicator */}
              <div style={{
                position: 'relative',
                flexShrink: 0
              }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #144dff 0%, #8b5cf6 50%, #ec4899 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 15px rgba(20, 77, 255, 0.4)',
                  animation: 'pulse-glow 2s ease-in-out infinite'
                }}>
                  <span style={{
                    color: 'white',
                    fontWeight: '800',
                    fontSize: '1.1rem',
                    textTransform: 'uppercase'
                  }}>
                    {userCurrentLobby.charAt(0).toUpperCase()}
                  </span>
                </div>
                {/* Live indicator dot */}
                <div style={{
                  position: 'absolute',
                  top: '-2px',
                  right: '-2px',
                  width: '14px',
                  height: '14px',
                  borderRadius: '50%',
                  background: '#22c55e',
                  border: '2px solid rgba(255, 255, 255, 0.9)',
                  boxShadow: '0 0 8px rgba(34, 197, 94, 0.6)',
                  animation: 'pulse-dot 1.5s ease-in-out infinite'
                }} />
              </div>
              
              {/* Text content with wrapping */}
              <div style={{
                flex: 1,
                minWidth: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: '2px'
              }}>
                <span style={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '0.65rem',
                  fontWeight: '600',
                  letterSpacing: '0.02em'
                }}>
                  Return to your active lobby
                </span>
                <span style={{
                  color: 'white',
                  fontWeight: '700',
                  fontSize: '1rem',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
                }}>
                  {userCurrentLobby.length > 15 ? userCurrentLobby.slice(0, 15) + '...' : userCurrentLobby}
                </span>
              </div>
              
              {/* Arrow indicator */}
              <div style={{
                flexShrink: 0,
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease'
              }}>
                <svg 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="white" 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </div>
            </div>
          </div>
        )}

        {/* Active Lobbies Section */}
        {(permissions === 'admin' || permissions === 'organizer') && activeLobbies.length > 0 && (
          <div style={{ 
            position: 'absolute',
            top: 'calc(32% + 80px)',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '85%',
            maxWidth: '280px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 10,
            transition: 'all 0.3s ease'
          }}>
            {isLoadingLobbies ? (
              <div style={{ textAlign: 'center', color: 'white' }}>
                <p>Loading your lobbies...</p>
              </div>
            ) : activeLobbies.length > 0 ? (
              <div
                className="admin-lobby-tile"
                onClick={() => navigateToAdminLobby(activeLobbies[0])}
              >
                {/* Animated pulse indicator */}
                <div className="admin-lobby-tile-icon">
                  <div className="admin-lobby-tile-icon-circle">
                    <span>
                      {activeLobbies[0] && activeLobbies[0].length > 0 ? activeLobbies[0].charAt(0).toUpperCase() : '?'}
                    </span>
                  </div>
                  {/* Live indicator dot */}
                  <div className="admin-lobby-tile-live-dot" />
                </div>
                
                {/* Text content */}
                <div className="admin-lobby-tile-content">
                  <span className="admin-lobby-tile-subtitle">
                    Manage your active lobby
                  </span>
                  <span className="admin-lobby-tile-title">
                    {activeLobbies[0] && activeLobbies[0].length > 15 ? activeLobbies[0].slice(0, 15) + '...' : activeLobbies[0]}
                  </span>
                </div>
                
                {/* Arrow indicator */}
                <div className="admin-lobby-tile-arrow">
                  <svg 
                    width="16" 
                    height="16" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="white" 
                    strokeWidth="2.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
      
      <LobbyCodeModal />
      <QRInstructionModal />
    </div>
  );

  
};

export default App;
