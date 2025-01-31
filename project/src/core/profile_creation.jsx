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
    image: userProfile?.image_data || null,
    imagePreview: userProfile?.image_data
      ? `data:image/jpeg;base64,${userProfile.image_data}`
      : '/assets/fakeprofile.png',//CHANGE THIS BACK AFTER THE EVENT
      //: '/path/to/default-placeholder.png', // Add a fallback placeholder
    croppedImage: null,
  });

  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [cropArea, setCropArea] = useState(null);
  const [isCropping, setIsCropping] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({
        ...formData,
        image: file,
        imagePreview: URL.createObjectURL(file)
      });
      setIsCropping(true);
    }
  };

  const handleCropComplete = (croppedArea, croppedAreaPixels) => {
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

  //CHANGE THIS BACK AFTER THE EVENT
  async function handleSubmit(e) {
    e.preventDefault();
  
    let base64Image;
  
    if (formData.croppedImage) {
      base64Image = formData.croppedImage.split(',')[1];
    } else if (formData.image instanceof File) {
      const imageBuffer = await formData.image.arrayBuffer();
      base64Image = btoa(
        new Uint8Array(imageBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
      );
    } else {
      // Convert default profile image (fakeprofile.png) to base64
      const response = await fetch('/assets/fakeprofile.png');
      const blob = await response.blob();
      const imageBuffer = await blob.arrayBuffer();
      base64Image = btoa(
        new Uint8Array(imageBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
      );
    }
  
    const jsonDataToSend = {
      name: formData.name,
      image_data: base64Image, // Send the selected or default image
    };
  
    console.log("JSON Data to Send:", jsonDataToSend);
  
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
      await checkAuth(); // Update UI with new profile
      console.log('Profile updated successfully:', result);
    } catch (error) {
      console.error('Error updating profile:', error);
    }

    onClose();
  }
  // async function handleSubmit(e) {
  //   e.preventDefault();

  //   let base64Image;

  //   // Handle cropped image (base64) or original image (File)
  //   if (formData.croppedImage) {
  //     // Use cropped image (base64)
  //     base64Image = formData.croppedImage.split(',')[1];
  //   } else if (formData.image instanceof File) {
  //     // Convert new image to base64
  //     const imageBuffer = await formData.image.arrayBuffer();
  //     base64Image = btoa(
  //       new Uint8Array(imageBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
  //     );
  //   } else if (userProfile?.image_data) {
  //     // Use existing image data
  //     base64Image = userProfile.image_data;
  //   } else {
  //     console.error('No valid image provided');
  //     return; // Exit if no image is available
  //   }

  //   const jsonDataToSend = {
  //     name: formData.name,
  //     image_data: base64Image,
  //   };

  //   console.log('Image data (first 100 chars):', base64Image.substring(0, 100));

  //   // Get access token from localStorage
  //   const token = localStorage.getItem('access_token');

  //   try {
  //     const response = await fetch(`${window.server_url}/update_profile`, {
  //       method: 'POST',
  //       headers: {
  //         Authorization: `Bearer ${token}`,
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify(jsonDataToSend),
  //     });

  //     if (!response.ok) {
  //       throw new Error('Failed to update profile');
  //     }

  //     const result = await response.json();
  //     await checkAuth();
  //     console.log('Profile updated successfully:', result);
  //   } catch (error) {
  //     console.error('Error updating profile:', error);
  //   }

  // };

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
          {/* <div className="form-group">
            <label htmlFor="image">Profile Image</label>
            <input
              type="file"
              id="image"
              accept="image/*"
              onChange={handleImageChange}
            />
            {formData.imagePreview && !isCropping && (
              <button type="button" onClick={() => setIsCropping(true)}>
                Crop Image
              </button>
            )}
            {isCropping && formData.imagePreview && (
              <div className="crop-container">
                <Cropper
                  image={formData.imagePreview}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={handleCropComplete}
                />
                <div className="slider-container">
                  <label htmlFor="zoom">Zoom</label>
                  <input
                    id="zoom"
                    type="range"
                    min={1}
                    max={3}
                    step={0.1}
                    value={zoom}
                    onChange={(e) => setZoom(e.target.value)}
                  />
                </div>
                <button type="button" onClick={handleSaveCroppedImage}>
                  Save Cropped Image
                </button>
              </div>
            )}

            <div className="image-preview-container">
              {formData.croppedImage ? (
                // Show cropped image
                <img
                  src={formData.croppedImage}
                  alt="Cropped Preview"
                  className="profile-image-preview"
                  style={{ width: '50%', height: '50%' }}
                />
              ) : formData.imagePreview ? (
                // Show existing image (or new uploaded image preview)
                <img
                  src={formData.imagePreview}
                  alt="Existing Profile Preview"
                  className="profile-image-preview"
                  style={{ width: '50%', height: '50%' }}
                />
              ) : (
                <img
                  src="/assets/fakeprofile.png" // Default image for display CHANGE THIS BACK AFTER THE EVENT
                  alt="Default Profile"
                  className="profile-image-preview"
                />
              )}
            </div>

          </div> */}
          <button type="submit" className="submit-button">
            {existingProfile ? 'Update Profile' : 'Create Profile'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfileCreation;
