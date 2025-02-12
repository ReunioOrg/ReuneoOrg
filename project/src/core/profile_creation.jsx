import React, { useState } from 'react';
import './profile_creation.css';
import { useContext } from 'react';
import { AuthContext } from './Auth/AuthContext';
import Cropper from 'react-easy-crop';
import getCroppedImg from './cropImage'; // Utility function for cropping

const ProfileCreation = ({ onSubmit, onClose, existingProfile }) => {
  const { user, userProfile, checkAuth } = useContext(AuthContext);
  
  const [formData, setFormData] = useState({
    name: userProfile?.name || '',
    image: null,
    imagePreview: userProfile?.image_data
      ? `data:image/jpeg;base64,${userProfile.image_data}`
      : '/assets/fakeprofile.png', // Default profile image
    croppedImage: null
  });
  

  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [cropArea, setCropArea] = useState(null);
  const [isCropping, setIsCropping] = useState(false);
  const [showSaveAnimation, setShowSaveAnimation] = useState(false);

  // Handle file selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData(prev => ({
          ...prev,
          image: file,
          imagePreview: event.target.result
        }));
        setIsCropping(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = (croppedArea, croppedAreaPixels) => {
    console.log('Cropped Area Pixels:', croppedAreaPixels);
    setCropArea(croppedAreaPixels);
  };

  const handleSaveCroppedImage = async () => {
    try {
      const croppedImage = await getCroppedImg(formData.imagePreview, cropArea);
      console.log('Cropped Image:', croppedImage); // Log the cropped image URL
      setFormData({ ...formData, croppedImage });
      setIsCropping(false);
    } catch (error) {
      console.error('Error cropping the image:', error);
    }
  };

  async function handleSubmit(e) {
    e.preventDefault();

    let base64Image;

    // Handle cropped image (base64) or original image (File)
    if (formData.croppedImage) {
      // Use cropped image (base64)
      base64Image = formData.croppedImage.split(',')[1];
    } else if (formData.image instanceof File) {
      // Convert new image to base64
      const imageBuffer = await formData.image.arrayBuffer();
      base64Image = btoa(
        new Uint8Array(imageBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
      );
    } else if (userProfile?.image_data) {
      // Use existing image data
      base64Image = userProfile.image_data;
    } else {
      console.error('No valid image provided');
      return; // Exit if no image is available
    }

    const jsonDataToSend = {
      name: formData.name,
      image_data: base64Image,
    };

    console.log('Image data (first 100 chars):', base64Image.substring(0, 100));

    // Get access token from localStorage
    const token = localStorage.getItem('access_token');

    try {
      const response = await fetch(`${window.server_url}/update_profile`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jsonDataToSend),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const result = await response.json();
      await checkAuth();
      console.log('Profile updated successfully:', result);
      
      // Close the profile creation modal after successful update
      onClose();
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  return (
    <div className="profile-creation-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div className="profile-creation-modal" style={{
        width: '70%',
        maxWidth: '500px',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '20px',
        padding: '2rem',
        boxShadow: '0 10px 30px rgba(20,77,255,0.15)',
        position: 'relative',
        border: '1px solid rgba(20,77,255,0.1)'
      }}>
        {/* Close Button */}
        <button onClick={onClose} style={{
          position: 'absolute',
          top: '1.2rem',
          right: '1.2rem',
          background: 'none',
          border: 'none',
          fontSize: '1.8rem',
          cursor: 'pointer',
          color: '#144dff',
          transition: 'transform 0.3s ease',
          '&:hover': {
            transform: 'scale(1.1)'
          }
        }}>×</button>
        
        {/* Header */}
        <h2 style={{
          fontSize: 'clamp(1.8rem, 6vw, 2.5rem)',
          color: '#144dff',
          textAlign: 'center',
          marginBottom: '2rem',
          fontWeight: '600'
        }}>Your Profile</h2>

        <form onSubmit={handleSubmit} style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem'
        }}>
          {/* Name Field */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.8rem'
          }}>
            <label style={{
              color: '#144dff',
              fontWeight: '500',
              fontSize: '1rem'
            }}>Your Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                border: '2px solid #e0e0e0',
                fontSize: '0.9rem',
                transition: 'all 0.3s ease',
                backgroundColor: 'rgba(255,255,255,0.9)',
                '&:focus': {
                  borderColor: '#144dff',
                  outline: 'none',
                  boxShadow: '0 0 0 3px rgba(20,77,255,0.1)'
                }
              }}
            />
          </div>

          {/* Current Profile Image or Cropped Preview */}
          {!isCropping && (
            <div style={{
              width: '250px',
              height: '250px',
              margin: '0 auto',
              borderRadius: '20%',
              overflow: 'hidden',
              border: '7px solid #144dff',
              boxShadow: '0 8px 25px rgba(20,77,255,0.2)',
              transition: 'transform 0.3s ease',
              '&:hover': {
                transform: 'scale(1.02)'
              }
            }}>
              <img
                src={
                  formData.croppedImage ? formData.croppedImage :
                  formData.imagePreview ? formData.imagePreview :
                  userProfile?.image_data ? `data:image/jpeg;base64,${userProfile.image_data}` :
                  '/assets/fakeprofile.png'
                }
                alt="Profile preview"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
            </div>
          )}

          {/* Upload Button */}
          <div style={{ textAlign: 'center' }}>
            <input
              type="file"
              id="image-upload"
              accept="image/*"
              onChange={handleImageChange}
              style={{ display: 'none' }}
            />
            <label
              htmlFor="image-upload"
              style={{
                padding: '0.8rem 1.2rem',
                background: 'linear-gradient(45deg, #144dff, #2979ff)',
                color: 'white',
                borderRadius: '25px',
                cursor: 'pointer',
                display: 'inline-block',
                fontSize: '0.9rem',
                fontWeight: '600',
                boxShadow: '0 4px 15px rgba(20,77,255,0.2)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 20px rgba(20,77,255,0.3)'
                }
              }}
            >
              Upload New Image
            </label>
          </div>

          {/* Cropper Interface */}
          {isCropping && (
            <div style={{
              width: '100%',
              maxWidth: '300px',
              margin: '0 auto',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1.2rem'
            }}>
              <div style={{
                position: 'relative',
                width: '250px',
                height: '250px',
                borderRadius: '20%',
                overflow: 'hidden',
                border: '7px solid #144dff',
                boxShadow: '0 8px 25px rgba(20,77,255,0.2)'
              }}>
                <Cropper
                  image={formData.imagePreview}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  onCropComplete={handleCropComplete}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                />
              </div>
              <div style={{
                display: 'flex',
                gap: '1rem',
                justifyContent: 'center'
              }}>
                <button
                  type="button"
                  onClick={() => {
                    setIsCropping(false);
                    // Don't clear the preview if we already have a cropped image
                    if (!formData.croppedImage) {
                      setFormData(prev => ({
                        ...prev,
                        imagePreview: null
                      }));
                    }
                  }}
                  style={{
                    padding: '0.8rem 1.2rem',
                    borderRadius: '25px',
                    border: '2px solid #144dff',
                    background: 'white',
                    color: '#144dff',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      background: 'rgba(20,77,255,0.1)'
                    }
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const croppedImage = await getCroppedImg(formData.imagePreview, cropArea);
                      setFormData(prev => ({
                        ...prev,
                        croppedImage,
                        imagePreview: croppedImage
                      }));
                      setIsCropping(false);
                      setShowSaveAnimation(true);
                      // Reset animation after it completes
                      setTimeout(() => setShowSaveAnimation(false), 10000);
                    } catch (error) {
                      console.error('Error cropping image:', error);
                    }
                  }}
                  className={`save-profile-button ${showSaveAnimation ? 'glow-bounce' : ''}`}
                  style={{
                    padding: '0.8rem 1.2rem',
                    borderRadius: '25px',
                    border: 'none',
                    background: 'linear-gradient(45deg, #144dff, #2979ff)',
                    color: 'white',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 15px rgba(20,77,255,0.2)',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 6px 20px rgba(20,77,255,0.3)'
                    }
                  }}
                >
                  Save Cropped Image
                </button>
              </div>
            </div>
          )}

          {/* Save Profile Button */}
          <button
            type="submit"
            className={`save-profile-button ${showSaveAnimation ? 'glow-bounce' : ''}`}
            style={{
              padding: '1rem',
              background: 'linear-gradient(45deg, #144dff, #2979ff)',
              color: 'white',
              border: 'none',
              borderRadius: '25px',
              fontSize: '1.1rem',
              fontWeight: '600',
              cursor: 'pointer',
              marginTop: '1rem',
              boxShadow: '0 4px 15px rgba(20,77,255,0.2)',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 20px rgba(20,77,255,0.3)'
              }
            }}
          >
            Save Profile
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfileCreation;
