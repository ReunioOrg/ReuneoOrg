// const asset_path="project/dist/assets/";
import React, { useState, useRef, useEffect, useContext } from 'react';
import ProfileCreation from './core/profile_creation';
import usePlaySound from './core/playsound';
import AuthProvider from './core/Auth/AuthContext';
import { AuthContext } from './core/Auth/AuthContext';
import LoginSignupLogoutButton from './core/Auth/LoginSignupLogoutButton';
import { useNavigate } from 'react-router-dom';
const App = () => {
  const [showProfileCreation, setShowProfileCreation] = useState(false);
  const [profileData, handleProfileSubmit] = useState(null);
  const { audioRef, error, playSound, loadSound } = usePlaySound();
  const { user, userProfile, checkAuth } = useContext(AuthContext);
  const navigate = useNavigate();
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
      <button 
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
      
      {((userProfile!=null) && (userProfile.name!='') && (userProfile.picture!=''))?
        <div className="main-content">
          <h1>Welcome, {userProfile.name}!</h1>
        </div>
        :
        <div className="main-content">
          <h1>You must make complete your profile to proceed.</h1>
          <p>In the top right click the Profile button to upload a picture of your face/self and your name.</p>
        </div>
      }






      <div className="events-list">
        <h2>Upcoming Events</h2>
        <div className="event-item">
          <h3>Speed Networking Session</h3>
          <p>Date: December 1, 2023</p>
          <p>Time: 2:00 PM - 4:00 PM</p>
          <p>Join professionals from various industries for rapid-fire networking.</p>
          <button className="primary-button" onClick={() => navigate('/lobby')}>Join Event</button>
        </div>

        <div className="event-item">
          <h3>Tech Industry Mixer</h3>
          <p>Date: December 15, 2023</p>
          <p>Time: 6:00 PM - 8:00 PM</p>
          <p>Connect with tech professionals and discuss latest industry trends.</p>
          <button className="primary-button">Join Event</button>
        </div>

        <div className="event-item">
          <h3>Startup Networking Night</h3>
          <p>Date: January 5, 2024</p>
          <p>Time: 7:00 PM - 9:00 PM</p>
          <p>Meet founders, investors, and startup enthusiasts.</p>
          <button className="primary-button">Join Event</button>
        </div>
      </div>


      

    </div>
  );
};

export default App;
