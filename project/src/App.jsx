// const asset_path="project/dist/assets/";
import React, { useState, useRef, useEffect, useContext } from 'react';
import ProfileCreation from './core/profile_creation';
import usePlaySound from './core/playsound';
import AuthProvider from './core/Auth/AuthContext';
import { AuthContext } from './core/Auth/AuthContext';

import LoginSignupLogoutButton from './core/Auth/LoginSignupLogoutButton';
import PureSignupPage from './core/Auth/PureSignupPage';

import useGetLobbyMetadata from './core/lobby/get_lobby_metadata';
import backgroundVideo from './assets/app_home_video.mp4';

import { useNavigate } from 'react-router-dom';
// import CreateLobbyButton from './core/lobby/CreateLobbyButton';
// import CreateLobby from './core/lobby/create_lobby';
// import './core/lobby/create_lobby.css';

const App = () => {
  const [showProfileCreation, setShowProfileCreation] = useState(false);
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

  // Function to navigate to a specific lobby
  const navigateToLobby = (lobbyCode) => {
    if (permissions === 'admin' || permissions === 'organizer') {
      navigate(`/admin_lobby_view?code=${lobbyCode}`);
    } else {
      navigate(`/lobby?code=${lobbyCode}`);
    }
  };

  return (
    <div style={{ position: 'relative', height: '100vh', overflow: 'hidden' }}>
      {/* Background Video */}
      <video className="background-video" autoPlay loop muted playsInline>
        <source src="/assets/app_home_video.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      
      {/* Main App Content */}
      <div style={{ position: 'relative', zIndex: 1, color: 'white' }}>
        
        <div style={{ position: 'absolute', top: '-1rem', left: '50%', transform: 'translateX(-50%)' }}>
          <img  
            src="/assets/reunio-logo-v3.png"
            alt="Logo"
            style={{width: '85px',height: '85px',objectFit: 'contain'}}
          />
        </div>

        <div style = {{marginTop: '10%',display: 'flex',flexDirection: 'column'}}>
        <LoginSignupLogoutButton user={user}/>
        
        {user && (  // Only render the Profile button if user exists
          <button
            style={{
              position: 'absolute',
              top: '.6rem',
              right: '3%',
              width: '25%',
              gap: '1rem',
              borderRadius: '12px',
              boxShadow: '0 0 10px rgba(74, 58, 58, 0.4)',
              outline: '1px solid rgba(74, 58, 58, 0.4)'
            }}
            className="profile-button"
            onClick={() => setShowProfileCreation(true)}
          >
            Profile
          </button>
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

        <div
          style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: '35%',
            textAlign: 'center',
          }}
        >
          {user && userProfile && userProfile.name && (
            <div className="main-content">
              <h3 style={{ 
                color: '#ffffff',
                background: 'linear-gradient(45deg, rgba(20, 77, 255, 0.7), rgba(0, 200, 255, 0.7))',
                padding: '0.2rem 0.6rem', // Reduced padding
                display: 'inline-block',
                borderRadius: '0.8rem', // Slightly reduced border radius
                fontSize: '1.2rem',
                marginTop: '-0.5rem',
                marginBottom: '0',
                boxShadow: '0 4px 15px rgba(20, 77, 255, 0.4)',
                textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.2)',
                backdropFilter: 'blur(5px)'
              }}>
                Welcome {userProfile.name.length > 30 ? `${userProfile.name.slice(0, 15)}` : userProfile.name}
              </h3>
            </div>
          )}
        </div>

        <div className="events-list" style={{ marginTop: '2.5rem', width: '94%', marginLeft: 'auto', marginRight: 'auto' }}>
          <h2 style={{ 
            textAlign: 'center', 
            width: '100%', 
            color: '#ffffff',
            fontSize: '1.2em',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            textShadow: '4px 4px 8px rgba(0,0,0,0.9)', // Enhanced shadow
            marginBottom: '1rem'
          }}>
            Pair up with new friends
          </h2>
          <div
            className="event-item"
            style={{
              width: '50%', // Reduced from 70%
              maxWidth: '400px', // Reduced from 500px
              margin: '0 auto',
              padding: '15px', // Reduced from 20px
              background: '#ffffff',
              borderRadius: '16px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
              marginBottom: '20px',
              border: '1px solid rgba(255, 255, 255, 0.5)',
              transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
              cursor: 'pointer',
              opacity: 1,
              ':hover': {
                transform: 'translateY(-5px)'
              }
            }}
          >
            <p
              style={{
                margin: '0 0 8px 0',
                color: '#2d3748',
                fontWeight: '600',
                fontSize: '1.1em',
                letterSpacing: '0.5px'
              }}
            >
              
            </p>
            <p
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
            </p>
            <div style={{ 
              display: 'flex', 
              gap: '12px', 
              flexDirection: 'column' 
            }}>
              <button 
                className="primary-button" 
                onClick={() => user ? navigate('/lobby') : navigate('/signup?redirect=lobby')}
                disabled={player_count === null || lobby_state === 'terminate'}
                style={{
                  opacity: (player_count === null || lobby_state === 'terminate') ? 1 : 1,
                  cursor: (player_count === null || lobby_state === 'terminate') ? 'not-allowed' : 'pointer',
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
                {!user ? 'Join Lobby' : 'Join Lobby'}
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
              {(permissions === 'admin' || permissions === 'organizer') && (
                <button 
                  className="primary-button" 
                  onClick={redirectToAdminLobby}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#2d3748',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '600',
                    transition: 'all 0.2s ease',
                    ':hover': {
                      backgroundColor: '#1a202c',
                      transform: 'scale(1.02)'
                    }
                  }}
                >
                  Admin Lobby View
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Active Lobbies Section */}
        {user && (
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
                    onClick={() => navigateToLobby(lobbyCode)}
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
    </div>
  );

  
};

export default App;
