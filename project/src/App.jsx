// const asset_path="project/dist/assets/";
import React, { useState, useRef, useEffect, useContext } from 'react';
import ProfileCreation from './core/profile_creation';
import usePlaySound from './core/playsound';
import AuthProvider from './core/Auth/AuthContext';
import { AuthContext } from './core/Auth/AuthContext';
import './App.css';
import { Html5QrcodeScanner } from 'html5-qrcode';

import LoginSignupLogoutButton from './core/Auth/LoginSignupLogoutButton';
import PureSignupPage from './core/Auth/PureSignupPage';

import useGetLobbyMetadata from './core/lobby/get_lobby_metadata';

import { useNavigate } from 'react-router-dom';
// import CreateLobbyButton from './core/lobby/CreateLobbyButton';
// import CreateLobby from './core/lobby/create_lobby';
// import './core/lobby/create_lobby.css';

const App = () => {
  const [showProfileCreation, setShowProfileCreation] = useState(false);
  const [showLobbyCodeModal, setShowLobbyCodeModal] = useState(false);
  const [lobbyCodeInput, setLobbyCodeInput] = useState('');
  const [lobbyCodeError, setLobbyCodeError] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [profileData, handleProfileSubmit] = useState(null);
  const { audioRef, error, playSound, loadSound, cancelSound } = usePlaySound();
  const { user, userProfile, checkAuth, permissions } = useContext(AuthContext);

  const [player_count, setPlayerCount] = useState(null);
  const [lobby_state, setLobbyState] = useState(null);
  const [activeLobbies, setActiveLobbies] = useState([]);
  const [isLoadingLobbies, setIsLoadingLobbies] = useState(false);

  const navigate = useNavigate();
  useGetLobbyMetadata(setPlayerCount, setLobbyState);

  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef(null);
  const scannerRef = useRef(null);

  // Function to fetch and redirect to admin's active lobby
  const redirectToAdminLobby = async () => {
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

  // Function to fetch user's active lobbies
  const fetchActiveLobbies = async () => {
    if (!user) return;
    
    setIsLoadingLobbies(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(window.server_url + '/view_my_active_lobbies', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
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

  // LobbyCodeModal Component
  const LobbyCodeModal = () => {
    if (!showLobbyCodeModal) return null;

    return (
      <div className="lobby-modal-overlay">
        <div className="lobby-modal-container">
          <button 
            onClick={() => {
              setShowLobbyCodeModal(false);
              setLobbyCodeInput('');
              setLobbyCodeError('');
              stopScanning();
            }}
            className="lobby-modal-close"
          >
            ×
          </button>
          <h2 className="lobby-modal-title">
            Join Lobby
          </h2>
          <form onSubmit={handleJoinLobby} className="lobby-form">
            <div className="lobby-input-container">
              <input
                type="text"
                name="name"
                placeholder="Enter Lobby Code"
                className="lobby-input"
                pattern="[a-zA-Z0-9]+"
                title="Only letters and numbers are allowed"
                required
              />
              {lobbyCodeError && (
                <div className="lobby-error-message">{lobbyCodeError}</div>
              )}
            </div>
            <button
              type="submit"
              className="lobby-submit-button"
            >
              Join
            </button>
            
            {!isScanning ? (
              <button
                type="button"
                className="lobby-scan-button"
                onClick={handleScanQRCode}
              >
                Scan
              </button>
            ) : (
              <div className="lobby-scan-container">
                <div id="qr-reader" className="lobby-scan-video"></div>
                <button
                  type="button"
                  className="lobby-scan-close"
                  onClick={stopScanning}
                >
                  Close Scanner
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    );
  };

  return (
    <div style={{ position: 'relative', height: 'var(--viewport-height)', overflow: 'hidden' }}>
      {/* Background Video */}
      <video className="background-video" autoPlay loop muted playsInline poster="/assets/demo_app_home_video_cover.jpg">
        <source src="/assets/demo_app_home_video_X2_small.mp4" type="video/mp4" />
        <source src="/assets/app_home_video_2.webm" type="video/webm" />
        {/* Fallback for browsers that don't support video at all */}
        <img src="/assets/demo_app_home_video_cover.jpg" alt="Background fallback" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        Your browser does not support the video tag.
      </video>
      
      {/* Main App Content */}
      <div style={{ position: 'relative', zIndex: 1, color: 'white' }}>
        
        <div style={{ position: 'absolute', top: '-3rem', left: '50%', transform: 'translateX(-50%)' }}>
          <img  
            src="/assets/reuneo_test_9.png"
            alt="Logo"
            style={{width: '110px',height: '110px',objectFit: 'contain'}}
          />
        </div>

        <div style = {{marginTop: '10%',display: 'flex',flexDirection: 'column'}}>
        <LoginSignupLogoutButton user={user}/>
        {user && (  // Only render the Profile button if user exists
          <div style={{ position: 'absolute', display: 'flex', alignItems: 'center', top: '-.8rem', right: '3%' }}>
            <button
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
                alignItems: 'center'
              }}
              className="login-button"
              onClick={() => setShowProfileCreation(true)}
            >
              <span style={{
                textShadow: '0 0 1px rgba(58, 53, 53, 0.5)',
                color: 'inherit'
              }}>
                Profile
              </span>
            </button>
          </div>
        )}
        </div>
        
        {showProfileCreation && (
          <ProfileCreation
            onSubmit={(data) => {
              setShowProfileCreation(false);
            }}
            onClose={() => setShowProfileCreation(false)}
            existingProfile={userProfile}
          />
        )}

        {/* Consolidated header - either "Pair up" or "Welcome" based on user role */}
        <div style={{ 
          position: 'absolute', 
          top: '5rem', 
          left: '50%', 
          transform: 'translateX(-50%)',
          width: '90%',
          maxWidth: '1200px',
          textAlign: 'center',
          marginBottom: '4rem',
          marginLeft: 'auto',
          marginRight: 'auto',
          zIndex: 1
        }}>
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
        </div>

        {/* Event items, the big div */}
        <div style={{ 
          marginTop: '32rem',  // Adjusted to account for both headers
          width: '94%', 
          marginLeft: 'auto', 
          marginRight: 'auto',
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
              <button 
                className={`primary-button ${(permissions !== 'admin' && permissions !== 'organizer') ? 'join-lobby-button' : ''}`} 
                onClick={() => user ? setShowLobbyCodeModal(true) : navigate('/signup?redirect=lobby')}
                disabled={player_count === null || lobby_state === 'terminate'}
                style={{
                  opacity: (player_count === null || lobby_state === 'terminate') ? 1 : 1,
                  cursor: (player_count === null || lobby_state === 'terminate') ? 'not-allowed' : 'pointer',
                  padding: '16px 20px',
                  backgroundColor: (permissions !== 'admin' && permissions !== 'organizer') ? 'transparent' : '#144dff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '14px',
                  fontWeight: '900',
                  fontSize: '1.2rem',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
                  transition: 'all 0.2s ease',
                  width: '160px',
                  // whiteSpace: 'nowrap',
                  margin: '0',
                  display: 'block',
                  position: 'relative',
                  zIndex: 1,
                  textAlign: 'center',
                  outline: (permissions !== 'admin' && permissions !== 'organizer') ? 'none' : '1px solid rgba(58, 53, 53, 0.7)',
                  ':hover': {
                    backgroundColor: (permissions !== 'admin' && permissions !== 'organizer') ? 'transparent' : '#535bf2',
                    transform: 'scale(1.02)'
                  }
                }}
              >
                <span style={{
                  textShadow: '0 0 1px rgba(58, 53, 53, 0.5)',
                  color: 'inherit',
                  whiteSpace: permissions !== 'admin' ? 'nowrap' : 'normal'
                }}>
                  {!user ? 'Join' : 'Join Lobby'}
                </span>
              </button>
              
              {/* Become a Host button - visible to non-logged in users and regular logged-in users */}
              {permissions !== 'admin' && permissions !== 'organizer' && (
                <button 
                  className="primary-button join-lobby-button" 
                  onClick={() => window.location.href = 'https://reuneo.app/how-the-app-works'}
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
                    // whiteSpace: 'nowrap',
                    margin: '0',
                    display: 'block',
                    position: 'relative',
                    zIndex: 1,
                    textAlign: 'center',
                    outline: 'none',
                    ':hover': {
                      transform: 'scale(1.02)'
                    }
                  }}
                >
                  <span style={{
                    textShadow: '0 0 1px rgba(58, 53, 53, 0.5)',
                    color: 'inherit'
                  }}>
                    Create
                  </span>
                </button>
              )}
              {(permissions === 'admin' || permissions === 'organizer') && (
                <button
                  className={`primary-button ${(permissions === 'admin' || permissions === 'organizer') ? 'create-lobby-button' : ''}`}
                  onClick={() => navigate('/create_lobby')}
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
                    // whiteSpace: 'nowrap',
                    margin: '0',
                    position: 'relative',
                    zIndex: 1,
                    textAlign: 'center',
                    ':hover': {
                      transform: 'scale(1.02)'
                    }
                  }}
                >
                  <span style={{
                    textShadow: '0 0 1px rgba(58, 53, 53, 0.5)',
                    color: 'inherit'
                  }}>
                    Create Lobby
                  </span>
                </button>
              )}
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

        {/* Active Lobbies Section */}
        {(permissions === 'admin' || permissions === 'organizer') && activeLobbies.length > 0 && (
          <div className="events-list" style={{ 
            marginTop: '-18rem', 
            width: '50%',
            height: '20%', 
            marginLeft: 'auto', 
            marginRight: 'auto', 
            position: 'relative',
            background: 'linear-gradient(135deg, rgba(20, 77, 255, 0.05), rgba(83, 91, 242, 0.05))',
            borderRadius: '30px',
            padding: '1rem',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            
            {isLoadingLobbies ? (
              <div style={{ textAlign: 'center', color: 'white' }}>
                <p>Loading your lobbies...</p>
              </div>
            ) : activeLobbies.length > 0 ? (
              <div style={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                justifyContent: 'center', 
                perspective: '1000px',
              }}>
                {activeLobbies.map((lobbyCode, index) => (
                  <div
                    key={index}
                    className="card"
                    style={{
                      width: '220px',
                      background: 'rgba(255, 255, 255, 0.95)',
                      borderRadius: '20px',
                      boxShadow: '0 10px 30px rgba(20, 77, 255, 0.15)',
                      border: '1px solid rgba(20, 77, 255, 0.2)',
                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                      cursor: 'pointer',
                      padding: '2rem 2rem',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      overflow: 'hidden',
                      transformStyle: 'preserve-3d',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'linear-gradient(135deg, rgba(20, 77, 255, 0.1), rgba(83, 91, 242, 0.1))',
                        opacity: 0,
                        transition: 'opacity 0.4s ease'
                      }
                    }}
                    onClick={() => navigateToAdminLobby(lobbyCode)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-10px) rotateX(5deg)';
                      e.currentTarget.style.boxShadow = '0 20px 40px rgba(20, 77, 255, 0.25)';
                      e.currentTarget.style.border = '1px solid rgba(20, 77, 255, 0.4)';
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.98)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0) rotateX(0)';
                      e.currentTarget.style.boxShadow = '0 10px 30px rgba(20, 77, 255, 0.15)';
                      e.currentTarget.style.border = '1px solid rgba(20, 77, 255, 0.2)';
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.95)';
                    }}
                  >
                    <div className="glow-button" style={{ 
                      width: '30px', 
                      height: '30px', 
                      borderRadius: '50%', 
                      background: 'linear-gradient(135deg, #144dff, #535bf2)',
                      marginBottom: '.5rem',
                      marginTop: '-1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '.8rem',
                      boxShadow: '0 8px 20px rgba(20, 77, 255, 0.3)',
                      transition: 'all 0.4s ease',
                      position: 'relative',
                      '&::after': {
                        content: '""',
                        position: 'absolute',
                        top: '-5px',
                        left: '-5px',
                        right: '-5px',
                        bottom: '-5px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, rgba(20, 77, 255, 0.2), rgba(83, 91, 242, 0.2))',
                        zIndex: -1,
                        animation: 'pulse 2s infinite'
                      }
                    }}>
                      {lobbyCode && lobbyCode.length > 0 ? lobbyCode.charAt(0).toUpperCase() : '?'}
                    </div>
                    <h3 style={{ 
                      marginTop: '0.5rem',
                      color: '#144dff',
                      fontWeight: '700',
                      fontSize: '.9em',
                      fontFamily: 'Helvetica',
                      textAlign: 'center',
                      textShadow: '0 2px 4px rgba(20, 77, 255, 0.1)',
                      letterSpacing: '0.5px'
                    }}>
                      Lobby {lobbyCode || 'Unknown'}
                    </h3>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ 
                // textAlign: 'center', 
                // color: 'white',
                // background: 'rgba(0, 0, 0, 0.3)',
                // padding: '1rem',
                // borderRadius: '8px',
                // maxWidth: '400px',
                // margin: '0 auto'
              }}>
                {/* <p>You don't have any active lobbies.</p>
                {(permissions === 'admin' || permissions === 'organizer') && (
                  <button
                    className="primary-button"
                    onClick={() => navigate('/create_lobby')}
                    style={{
                      marginTop: '1rem',
                      padding: '8px 16px',
                      backgroundColor: '#144dff', 
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: '600',
                      transition: 'all 0.2s ease',
                      ':hover': {
                        backgroundColor: '#535bf2',
                        transform: 'scale(1.02)'
                      }
                    }}
                  >
                    Create a Lobby
                  </button>
                )} */}
              </div>
            )}
          </div>
        )}
      </div>
      
      <LobbyCodeModal />
    </div>
  );

  
};

export default App;
