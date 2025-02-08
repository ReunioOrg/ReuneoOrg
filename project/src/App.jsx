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
const App = () => {
  const [showProfileCreation, setShowProfileCreation] = useState(false);
  const [profileData, handleProfileSubmit] = useState(null);
  const { audioRef, error, playSound, loadSound, cancelSound } = usePlaySound();
  const { user, userProfile, checkAuth, permissions } = useContext(AuthContext);
  const [player_count, setPlayerCount] = useState(null);

  const navigate = useNavigate();
  useGetLobbyMetadata(setPlayerCount);

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
      <video className="background-video" autoPlay loop muted playsInline>
        <source src="/MeetFrontend/assets/app_home_video.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      
      {/* Main App Content */}
      <div style={{ position: 'relative', zIndex: 1, color: 'white' }}>
      <div style={{ position: 'absolute', top: '2rem', left: '50%', transform: 'translateX(-50%)' }}>
        <img
          src="/MeetFrontend/assets/reunio-logo-with-depth.png"
          alt="Logo"
          style={{width: '300px',height: '300px',objectFit: 'contain'}}
        />
      </div>

        <div style = {{marginTop: '10%',display: 'flex',flexDirection: 'column'}}>
        <LoginSignupLogoutButton user={user}/>
        <button
          style={{
            position: 'absolute',
            top: '3.5rem',
            right: '3%',
            width: '25%',
            gap: '1rem',
          }}
          className="profile-button"
          onClick={() => setShowProfileCreation(true)}
        >
          Profile
        </button>
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
            marginTop: '50%',
            textAlign: 'center',
          }}
        >
          {user && userProfile && userProfile.name && (
            <div className="main-content">
              <h3 style={{ 
                color: '#ffffff', 
                backgroundColor: 'rgba(0, 122, 255, 0.5)',
                padding: '0.25rem 0.5rem',
                display: 'inline-block',
                borderRadius: '0.5rem'
              }}>
                Welcome {userProfile.name.length > 30 ? `${userProfile.name.slice(0, 15)}` : userProfile.name}, you've arrived!
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
            textShadow: '4px 4px 8px rgba(0,0,0,0.75)', // Enhanced shadow
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
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
              marginBottom: '20px',
              border: '1px solid rgba(255, 255, 255, 0.5)',
              transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
              cursor: 'pointer',
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
              {player_count} in lobby
            </p>
            <div style={{ 
              display: 'flex', 
              gap: '12px', 
              flexDirection: 'column' 
            }}>
              <button 
                className="primary-button" 
                onClick={() => navigate('/lobby')}
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
                Join Event
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
