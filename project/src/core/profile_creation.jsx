import React, { useState } from 'react';
import './profile_creation.css';
import { useContext } from 'react';
import { AuthContext } from './Auth/AuthContext';

const ProfileCreation = ({ onSubmit, onClose, existingProfile }) => {

  const { user, userProfile, checkAuth } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    name: userProfile?.name || '',
    image: userProfile?.image_data || null,
    imagePreview: userProfile?.image_data ? `data:image/jpeg;base64,${userProfile.image_data}` : null
  });

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({
        ...formData,
        image: file,
        imagePreview: URL.createObjectURL(file)
      });
    }
  };

  async function handleSubmit(e) {
    e.preventDefault();

    // Convert image to base64 string for easier handling
    const imageBuffer = await formData.image.arrayBuffer();
    const base64Image = btoa(
      new Uint8Array(imageBuffer)
        .reduce((data, byte) => data + String.fromCharCode(byte), '')
    );

    const jsonDataToSend = {
      name: formData.name,
      image_data: base64Image
    };

    console.log("Image data (first 100 chars):", base64Image.substring(0, 100));

    // Get access token from localStorage
    const token = localStorage.getItem('access_token');

    try {
      const response = await fetch(window.server_url+'/update_profile', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify(jsonDataToSend)
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const result = await response.json();
      await checkAuth();
      console.log('Profile updated successfully:', result);

      
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  return (
    <div className="profile-creation-overlay">
      <div className="profile-creation-modal">
        <button className="close-button" onClick={onClose}>×</button>
        <h2>{existingProfile ? 'Your Profile' : 'Create Your Profile'}</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Your Name</label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>
          <div className="form-group">
            <label htmlFor="image">Profile Image</label>
            <input
              type="file"
              id="image"
              accept="image/*"
              onChange={handleImageChange}
            />
            {formData.imagePreview && (
              <img
                src={formData.imagePreview}
                alt="Profile Preview"
                className="profile-image-preview"
                style={{width: '50%', height: '50%'}}
              />
            )}
          </div>
          <button type="submit" className="submit-button">
            {existingProfile ? 'Update Profile' : 'Create Profile'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfileCreation;
