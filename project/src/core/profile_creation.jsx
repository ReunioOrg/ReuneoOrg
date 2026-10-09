import React, { useState } from 'react';
import './profile_creation.css';
import { useContext } from 'react';
import { AuthContext } from './Auth/AuthContext';
import Cropper from 'react-easy-crop';
import getCroppedImg from './cropImage'; // Utility function for cropping
import { apiFetch } from './utils/api';

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

    try {
      const response = await apiFetch('/update_profile', {
        method: 'POST',
        headers: {
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
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div className="profile-creation-modal" style={{
        width: '70%',
        maxWidth: '500px',
        borderRadius: '20px',
        padding: '2rem',
        position: 'relative'
      }}>
        {/* Close Button */}
        <button onClick={onClose} className="profile-editor-close" style={{
          position: 'absolute',
          top: '1.2rem',
          right: '1.2rem',
          fontSize: '1.8rem',
          cursor: 'pointer',
          transition: 'transform 0.3s ease'
        }}>×</button>
        
        {/* Header */}
        <h2 className="profile-editor-title" style={{
          fontSize: 'clamp(1.8rem, 6vw, 2.5rem)',
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
            <label className="profile-editor-label" style={{
              fontWeight: '500',
              fontSize: '1rem'
            }}>Your Name</label>
            <input
              type="text"
              className="profile-editor-input"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                fontSize: '0.9rem',
                transition: 'all 0.3s ease'
              }}
            />
          </div>

          {/* Current Profile Image or Cropped Preview */}
          {!isCropping && (
            <div className="profile-editor-avatar" style={{
              width: '250px',
              height: '250px',
              margin: '0 auto',
              borderRadius: '20%',
              overflow: 'hidden',
              transition: 'transform 0.3s ease'
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
              className="profile-editor-primary"
              style={{
                padding: '0.8rem 1.2rem',
                borderRadius: '25px',
                cursor: 'pointer',
                display: 'inline-block',
                fontSize: '0.9rem',
                fontWeight: '600',
                transition: 'all 0.3s ease'
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
              <div className="profile-editor-crop-frame" style={{
                position: 'relative',
                width: '250px',
                height: '250px',
                borderRadius: '20%',
                overflow: 'hidden'
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
                  className="profile-editor-cancel"
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
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
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
                  className={`save-profile-button profile-editor-primary ${showSaveAnimation ? 'glow-bounce' : ''}`}
                  style={{
                    padding: '0.8rem 1.2rem',
                    borderRadius: '25px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
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
            className={`save-profile-button profile-editor-primary ${showSaveAnimation ? 'glow-bounce' : ''}`}
            style={{
              padding: '1rem',
              borderRadius: '25px',
              fontSize: '1.1rem',
              fontWeight: '600',
              cursor: 'pointer',
              marginTop: '1rem',
              transition: 'all 0.3s ease'
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
