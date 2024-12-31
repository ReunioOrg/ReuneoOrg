// const asset_path="project/dist/assets/";
import React, { useState, useRef, useEffect, useContext } from 'react';
import ProfileCreation from './core/profile_creation';
import usePlaySound from './core/playsound';
import AuthProvider from './core/Auth/AuthContext';
import { AuthContext } from './core/Auth/AuthContext';
import LoginSignupLogoutButton from './core/Auth/LoginSignupLogoutButton';
import useGetLobbyMetadata from './core/lobby/get_lobby_metadata';

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
    <div>
      <LoginSignupLogoutButton user={user} />
      <button style={{position: 'absolute', top: '3.5rem', right: '3%', width: '25%', gap: '1rem'}}
        className="profile-button"
        onClick={() => setShowProfileCreation(true)}
      >
        Profile
      </button>

      {showProfileCreation && (
        <ProfileCreation
          onSubmit={handleProfileSubmit}
          onClose={() => setShowProfileCreation(false)}
          existingProfile={userProfile}
        />
      )}
      
      <div style={{width: '100%', position: 'relative', marginTop: '15%'}}>
        {((userProfile!=null) && (userProfile.name!='') && (userProfile.picture!=''))?
          <div className="main-content">
            <h3>Welcome, {userProfile.name}!</h3>
          </div>
          :
          <div className="main-content">
            <h3>You must make complete your profile to proceed.</h3>
            <p>In the top right click the Profile button to upload a picture of your face/self and your name.</p>
          </div>
        }
      </div>





      <div className="events-list" style={{marginTop: '1rem', width: '94%', left: '3%'}}>
        <h2 style={{textAlign: 'center', width: '100%', color: '#00008B'}}>Lobbies</h2>
        <div className="event-item" style={{
          width: '85%',
          maxWidth: '600px',
          flexDirection: 'column',
          margin: '0 auto',
          padding: '20px',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          marginBottom: '20px',
          border: '1px solid #ccc',
        }}>
          <p style={{ margin: '0 0 0px 0', color: 'black', fontWeight: 'bold', fontSize: '1.2em'}}>Speed Networking</p>
          {/* <p style={{ margin: '0 0 0px 0', color: '#566666', fontWeight: 'bold', fontSize: '.8em'}}>Join professionals from various industries for rapid-fire networking.</p> */}
          <p style={{ margin: '0 0 0px 0', color: 'blue', fontWeight: 'bold', fontSize: '.8em'}}>{player_count} in lobby</p>
          <div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
            <button className="primary-button" onClick={() => {
              navigate('/lobby');
            }}>Join Event</button>
            {(permissions=="admin") && (
              <button className="primary-button" onClick={() => {
                navigate('/admin_lobby_view');
              }}>Admin Lobby View</button>
            )}
          </div>
          
        </div>

      </div>
    </div>
  );
};

export default App;
