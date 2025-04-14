// const asset_path="project/dist/assets/";
import React, { useState, useRef, useEffect, useContext } from 'react';
import ProfileCreation from './core/profile_creation';
import usePlaySound from './core/playsound';
import AuthProvider from './core/Auth/AuthContext';
import { AuthContext } from './core/Auth/AuthContext';
import './App.css';

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
          </form>
        </div>
      </div>
    );
  };

  return (
    <div style={{ position: 'relative', height: '100vh', overflow: 'hidden' }}>
      {/* Background Video */}
      <video className="background-video" autoPlay loop muted playsInline poster="/assets/app_home_screenshot_5.png">
        <source src="/assets/app_home_video_5.mp4" type="video/mp4" />
        <source src="/assets/app_home_video_2.webm" type="video/webm" />
        {/* Fallback for browsers that don't support video at all */}
        <img src="/assets/app_home_screenshot_5.jpg" alt="Background fallback" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        Your browser does not support the video tag.
      </video>
      
      {/* Main App Content */}
      <div style={{ position: 'relative', zIndex: 1, color: 'white' }}>
        
        <div style={{ position: 'absolute', top: '-2rem', left: '50%', transform: 'translateX(-50%)' }}>
          <img  
            src="/assets/reunio-game-logo-3.png"
            alt="Logo"
            style={{width: '100px',height: '100px',objectFit: 'contain'}}
          />
        </div>

        <div style = {{marginTop: '10%',display: 'flex',flexDirection: 'column'}}>
        <LoginSignupLogoutButton user={user}/>
        {user && (  // Only render the Profile button if user exists
          <div style={{ position: 'absolute', display: 'flex', alignItems: 'center', top: '.25rem', right: '3%' }}>
            <button
              style={{
                borderRadius: '14px',
                boxShadow: '0 0 10px rgba(74, 58, 58, 0.5)',
                outline: '1px solid rgba(58, 53, 53, 0.9)',
                fontWeight: '700',
                fontSize: '1.2rem'
              }}
              className="login-button"
              onClick={() => setShowProfileCreation(true)}
            >
              <span style={{
                textShadow: '0 0 1px rgba(58, 53, 53, 0.5)',
                WebkitTextStroke: '0.6px rgba(58, 53, 53, 0.3)',
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

        {/* Welcome message */}
        {user && userProfile && userProfile.name && (
          <div style={{ 
            width: '100%', 
            textAlign: 'center',
            position: 'absolute',
            top: '12rem',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1
          }}>
            <h3 className="welcome-header">
              {(() => {
                const text = `Welcome ${userProfile.name.slice(0, 10)}`;
                return text.split("").map((char, index) => (
                  <span 
                    key={index} 
                    style={{ 
                      "--i": index + 1,
                      ...(char === " " ? { marginRight: "0.5em" } : {})
                    }}
                  >
                    {char}
                  </span>
                ));
              })()}
            </h3>
          </div>
        )}

        {/*Pair up header */}
        <div style={{ 
          position: 'absolute', 
          top: '8rem', 
          left: '50%', 
          transform: 'translateX(-50%)',
          width: '100%',
          textAlign: 'center',
          marginBottom: '4rem'
        }}>
          <h2 className={!user ? "welcome-header" : ""} style={{ 
            color: '#ffffff',
            fontSize: '1.2em',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            textShadow: '4px 4px 8px rgba(0,0,0,0.9)',
            margin: 0
          }}>
            {!user ? (
              (() => {
                const text = "Pair up with new friends";
                return text.split("").map((char, index) => (
                  <span 
                    key={index} 
                    style={{ 
                      "--i": index + 1,
                      marginRight: char === " " ? "0.5em" : "1px"
                    }}
                  >
                    {char}
                  </span>
                ));
              })()
            ) : (
              "Pair up with new friends"
            )}
          </h2>
        </div>

        

        {/* Event items, the big div */}
        <div style={{ 
          marginTop: '16rem',  // Adjusted to account for both headers
          width: '94%', 
          marginLeft: 'auto', 
          marginRight: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          {/* Event item */}
          <div
            className="event-item"
            style={{
              width: '50%',
              maxWidth: '400px',
              margin: '0 auto',
              padding: '10px 12px',
              background: '#ffffff',
              borderRadius: '16px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
              marginBottom: '20px',
              // border: '1px solid rgba(255, 255, 255, 0.5)',
              outline: '1px solid rgb(58, 53, 53, 0.8)',
              transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
              cursor: 'pointer',
              opacity: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
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
              gap: '18px', 
              flexDirection: 'column' 
            }}>
              <button 
                className="primary-button join-lobby-button" 
                onClick={() => user ? setShowLobbyCodeModal(true) : navigate('/signup?redirect=lobby')}
                disabled={player_count === null || lobby_state === 'terminate'}
                style={{
                  opacity: (player_count === null || lobby_state === 'terminate') ? 1 : 1,
                  cursor: (player_count === null || lobby_state === 'terminate') ? 'not-allowed' : 'pointer',
                  padding: '12px 24px',
                  backgroundColor: '#144dff',
                  color: 'white',
                  border: 'none',
                  outline: '2px solid rgba(58, 53, 53, 0.8)',
                  borderRadius: '14px',
                  fontWeight: '900',
                  fontSize: '1.2rem',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
                  transition: 'all 0.2s ease',
                  minWidth: '180px',
                  whiteSpace: 'nowrap',
                  ':hover': {
                    backgroundColor: '#535bf2',
                    transform: 'scale(1.02)'
                  }
                }}
              >
                <span style={{
                  textShadow: '0 0 1px rgba(58, 53, 53, 0.5)',
                  WebkitTextStroke: '0.5px rgba(58, 53, 53, 0.4)',
                  color: 'inherit'
                }}>
                  {!user ? 'Join A Lobby' : 'Join A Lobby'}
                </span>
              </button>
              {(permissions === 'admin' || permissions === 'organizer') && (
                <button
                  className="primary-button"
                  onClick={() => navigate('/create_lobby')}
                  style={{
                    padding: '12px 24px',
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
                  Create Lobby
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
                    WebkitTextStroke: '0.5px rgba(58, 53, 53, 0.4)',
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
        {(permissions === 'admin' || permissions === 'organizer') && (
          <div className="events-list" style={{ marginTop: '2rem', width: '94%', marginLeft: 'auto', marginRight: 'auto', marginBottom: '2rem' }}>
            <h2 style={{ 
              textAlign: 'center', 
              width: '100%', 
              color: '#ffffff',
              fontSize: '1.2em',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              textShadow: '4px 4px 8px rgba(0,0,0,0.9)',
              marginBottom: '1rem'
            }}>
              Your Active Lobbies
            </h2>
            
            {isLoadingLobbies ? (
              <div style={{ textAlign: 'center', color: 'white' }}>
                <p>Loading your lobbies...</p>
              </div>
            ) : activeLobbies.length > 0 ? (
              <div style={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                justifyContent: 'center', 
                gap: '1rem' 
              }}>
                {activeLobbies.map((lobbyCode, index) => (
                  <div
                    key={index}
                    className="card"
                    style={{
                      width: '200px',
                      background: '#ffffff',
                      borderRadius: '16px',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
                      border: '1px solid rgba(255, 255, 255, 0.5)',
                      transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                      cursor: 'pointer',
                      padding: '1.5rem',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                    onClick={() => navigateToAdminLobby(lobbyCode)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-5px)';
                      e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.7)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.6)';
                    }}
                  >
                    <div className="glow-button" style={{ 
                      width: '40px', 
                      height: '40px', 
                      borderRadius: '50%', 
                      backgroundColor: '#144dff',
                      marginBottom: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 'bold'
                    }}>
                      {lobbyCode && lobbyCode.length > 0 ? lobbyCode.charAt(0).toUpperCase() : '?'}
                    </div>
                    <h3 style={{ 
                      margin: '0 0 0.5rem 0', 
                      color: '#2d3748',
                      fontWeight: '600',
                      fontSize: '1.1em',
                      textAlign: 'center'
                    }}>
                      Lobby {lobbyCode || 'Unknown'}
                    </h3>
                    <p style={{ 
                      margin: '0', 
                      color: '#4299e1',
                      fontWeight: '500',
                      fontSize: '0.9em',
                      textAlign: 'center'
                    }}>
                      Click to join
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ 
                textAlign: 'center', 
                color: 'white',
                background: 'rgba(0, 0, 0, 0.3)',
                padding: '1rem',
                borderRadius: '8px',
                maxWidth: '400px',
                margin: '0 auto'
              }}>
                <p>You don't have any active lobbies.</p>
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
                )}
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
