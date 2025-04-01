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

  const navigate = useNavigate();
  useGetLobbyMetadata(setPlayerCount, setLobbyState);

  // const handleProfileSubmit = (profileData) => {
  //   // Here you would typically send the data to your server
  //   setUserProfile(profileData);
  //   setShowProfileCreation(false); 
  // };

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <div style={{ position: 'relative', height: '100vh', overflow: 'hidden' }}>
      {/* Background Video */}
      <video className="background-video" autoPlay loop muted playsInline poster="/assets/app_home_screenshot.png">
        <source src="/assets/app_home_video_2.mp4" type="video/mp4" />
        <source src="/assets/app_home_video_2.webm" type="video/webm" />
        {/* Fallback for browsers that don't support video at all */}
        <img src="/assets/app_home_screenshot.png" alt="Background fallback" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        Your browser does not support the video tag.
      </video>
      
      {/* Main App Content */}
      <div style={{ position: 'relative', zIndex: 1, color: 'white' }}>
        
        <div style={{ position: 'absolute', top: '-2rem', left: '50%', transform: 'translateX(-50%)' }}>
          <img  
            src="/assets/reunio-logo-v5.png"
            alt="Logo"
            style={{width: '110px',height: '110px',objectFit: 'contain'}}
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
              boxShadow: '0 0 10px rgba(74, 58, 58, 0.5)',
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

        <div style={{ 
          marginTop: '12rem',  // Consistent top margin from the top of the page
          width: '94%', 
          marginLeft: 'auto', 
          marginRight: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'  // Creates consistent spacing between elements
        }}>
          {/* Welcome message - will only take up space when present */}
          {user && userProfile && userProfile.name && (
            <div style={{ 
              width: '100%', 
              textAlign: 'center',
            }}>
              <h3 className="welcome-header">
                {(() => {
                  const text = `Welcome ${userProfile.name.length > 30 ? userProfile.name.slice(0, 15) : userProfile.name}`;
                  return text.split("").map((char, index) => (
                    <span 
                      key={index} 
                      style={{ 
                        "--i": index + 1,
                        ...(char === " " ? { marginRight: "0.5em" } : {}) // Add extra space after "Welcome"
                      }}
                    >
                      {char}
                    </span>
                  ));
                })()}
              </h3>
            </div>
          )}

          {/* Pair up header */}
          <h2 style={{ 
            textAlign: 'center', 
            width: '100%', 
            color: '#ffffff',
            fontSize: '1.2em',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            textShadow: '4px 4px 8px rgba(0,0,0,0.9)',
            margin: 0  // Remove default margins
          }}>
            Pair up with new friends
          </h2>

          {/* Event item */}
          <div
            className="event-item"
            style={{
              width: '50%',
              maxWidth: '400px',
              margin: '0 auto',
              padding: '14px 8px',
              background: '#ffffff',
              borderRadius: '16px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
              marginBottom: '20px',
              border: '1px solid rgba(255, 255, 255, 0.5)',
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
                  borderRadius: '14px',
                  fontWeight: '600',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
                  transition: 'all 0.2s ease',
                  ':hover': {
                    backgroundColor: '#535bf2',
                    transform: 'scale(1.02)'
                  }
                }}
              >
                {!user ? 'Join Lobby' : 'Join Lobby'}
              </button>
              <button
                className="primary-button"
                onClick={() => navigate('/product-selection')}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#144dff', 
                  color: 'white',
                  border: 'none',
                  borderRadius: '14px',
                  fontWeight: '600',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
                  transition: 'all 0.2s ease',
                  ':hover': {
                    backgroundColor: '#535bf2',
                    transform: 'scale(1.02)'
                  }
                }}
              >
                Create Lobby
              </button>
              {permissions === 'admin' && (
                <button 
                  className="primary-button" 
                  onClick={() => navigate('/admin_lobby_view')}
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
      </div>
    </div>
  );

  
};

export default App;
