// const asset_path="project/dist/assets/";
import React, { useState, useRef, useEffect, useContext } from 'react';
import ProfileCreation from './core/profile_creation';
import usePlaySound from './core/playsound';
import AuthProvider from './core/Auth/AuthContext';
import { AuthContext } from './core/Auth/AuthContext';
import LoginSignupLogoutButton from './core/Auth/LoginSignupLogoutButton';
import useGetLobbyMetadata from './core/lobby/get_lobby_metadata';
import backgroundVideo from './assets/bluespace_homevideo.mp4';


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
        <source src="/MeetFrontend/assets/bluespace_homevideo.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      
      {/* Main App Content */}
      <div style={{ position: 'relative', zIndex: 1, color: 'white' }}>
      <div style={{ position: 'absolute', top: '3rem', left: '50%', transform: 'translateX(-50%)' }}>
        <img
          src="/MeetFrontend/assets/Reunio-white-4K.png"
          alt="Logo"
          style={{width: '150px',height: '150px',objectFit: 'contain'}}
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
            marginTop: '38%',
            textAlign: 'center',
          }}
        >
          {userProfile && userProfile.name ? (
            <div className="main-content">
              <h3 style={{ color: '#ffffff' }}>
                Welcome {userProfile.name.length > 30 ? `${userProfile.name.slice(0, 15)}` : userProfile.name}, you've arrived!
              </h3>
            </div>
          ) : (
            <div className="main-content">
              <h3 style={{color: '#ffffff' }}>
                Welcome, you've arrived</h3>
            </div>
          )}
        </div>

        <div className="events-list" style={{ marginTop: '2rem', width: '94%', marginLeft: 'auto', marginRight: 'auto' }}>
          <h2 style={{ textAlign: 'center', width: '100%', color: '#ffffff' }}>
            Active Lobbies
          </h2>
          <div
            className="event-item"
            style={{
              width: '85%',
              maxWidth: '600px',
              margin: '0 auto',
              padding: '20px',
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              marginBottom: '20px',
              border: '1px solid #ccc',
            }}
          >
            <p
              style={{
                margin: '0 0 0px 0',
                color: 'black',
                fontWeight: 'bold',
                fontSize: '1.2em',
              }}
            >
              Speed Networking 1
            </p>
            <p
              style={{
                margin: '0 0 0px 0',
                color: 'blue',
                fontWeight: 'bold',
                fontSize: '.8em',
              }}
            >
              {player_count} in lobby
            </p>
            <div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
              <button className="primary-button" onClick={() => navigate('/lobby')}>
                Join Event
              </button>
              {permissions === 'admin' && (
                <button className="primary-button" onClick={() => navigate('/admin_lobby_view')}>
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
