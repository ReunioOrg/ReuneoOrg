import React, { useState, useEffect, useContext, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext } from '../Auth/AuthContext';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../cropImage';
import { apiFetch } from '../utils/api';
import './LobbyProfileModal.css';

const LobbyProfileModal = ({ isOpen, onClose }) => {
    const { userProfile } = useContext(AuthContext);
    
    // Form state
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [contactUrl, setContactUrl] = useState('');
    const [imagePreview, setImagePreview] = useState(null);
    const [croppedImage, setCroppedImage] = useState(null);
    const [isEmailVerified, setIsEmailVerified] = useState(false);
    
    // Cropping state
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [cropArea, setCropArea] = useState(null);
    const [isCropping, setIsCropping] = useState(false);
    
    // UI state
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [isLoadingData, setIsLoadingData] = useState(true);
    
    const fileInputRef = useRef(null);

    // Reset state and load data when modal opens
    useEffect(() => {
        if (isOpen) {
            // Reset UI state for clean open
            setError('');
            setCroppedImage(null);
            setIsCropping(false);
            setCrop({ x: 0, y: 0 });
            setZoom(1);
            loadUserData();
        }
    }, [isOpen]);

    const loadUserData = async () => {
        setIsLoadingData(true);
        setError('');
        
        try {
            const response = await apiFetch('/load_user');
            
            if (response.ok) {
                const userData = await response.json();
                setName(userData.profile?.name || '');
                setEmail(userData.email || '');
                setContactUrl(userData.profile?.contact_url || '');
                setIsEmailVerified(userData.email_verified === true);
                
                // Set image preview from existing profile
                if (userData.profile?.image_data) {
                    setImagePreview(`data:image/jpeg;base64,${userData.profile.image_data}`);
                } else if (userProfile?.image_data) {
                    setImagePreview(`data:image/jpeg;base64,${userProfile.image_data}`);
                }
            }
        } catch (err) {
            console.error('Error loading user data:', err);
            // Fallback to context data
            setName(userProfile?.name || '');
            setEmail(user?.email || '');
            if (userProfile?.image_data) {
                setImagePreview(`data:image/jpeg;base64,${userProfile.image_data}`);
            }
        } finally {
            setIsLoadingData(false);
        }
    };

    // Handle image selection
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setImagePreview(event.target.result);
                setIsCropping(true);
            };
            reader.readAsDataURL(file);
        }
    };

    // Handle crop complete
    const handleCropComplete = (croppedArea, croppedAreaPixels) => {
        setCropArea(croppedAreaPixels);
    };

    // Save cropped image
    const handleSaveCrop = async () => {
        try {
            const cropped = await getCroppedImg(imagePreview, cropArea);
            setCroppedImage(cropped);
            setImagePreview(cropped);
            setIsCropping(false);
        } catch (err) {
            console.error('Error cropping image:', err);
            setError('Failed to crop image. Please try again.');
        }
    };

    // Cancel crop
    const handleCancelCrop = () => {
        setIsCropping(false);
        // Reset to original if we have one
        if (userProfile?.image_data) {
            setImagePreview(`data:image/jpeg;base64,${userProfile.image_data}`);
        }
    };

    // Submit form
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        try {
            // Build payload
            const payload = {
                name: name.trim() || undefined,
                contact_url: contactUrl.trim() || undefined
            };

            // Only include email if not verified (verified emails are locked)
            if (!isEmailVerified && email.trim()) {
                // Basic email validation
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(email.trim())) {
                    setError('Please enter a valid email address.');
                    setIsSubmitting(false);
                    return;
                }
                payload.email = email.trim();
            }

            // Handle image if changed
            if (croppedImage) {
                payload.image_data = croppedImage.split(',')[1];
            }

            const response = await apiFetch('/update_profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to update profile');
            }

            // Close modal immediately on success
            setIsSubmitting(false);
            onClose();

        } catch (err) {
            console.error('Error updating profile:', err);
            
            if (err.message?.toLowerCase().includes('already associated')) {
                setError('This email is already in use by another account.');
            } else {
                setError(err.message || 'Failed to update profile. Please try again.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    // Get display image
    const displayImage = croppedImage || imagePreview || '/assets/avatar_3.png';

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div 
                    className="lobby-profile-modal-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={onClose}
                >
                    <motion.div 
                        className="lobby-profile-modal"
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ 
                            type: "spring", 
                            stiffness: 400, 
                            damping: 30 
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close Button */}
                        <button 
                            className="lobby-profile-modal-close"
                            onClick={onClose}
                            aria-label="Close"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                        </button>

                        {/* Header */}
                        <h2 className="lobby-profile-modal-title">Edit Profile</h2>

                        {isLoadingData ? (
                            <div className="lobby-profile-modal-loading">
                                <div className="lobby-profile-spinner" />
                                <span>Loading...</span>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="lobby-profile-form">
                                {/* Error Message */}
                                {error && (
                                    <div className="lobby-profile-error">
                                        {error}
                                    </div>
                                )}

                                {/* Profile Image Section */}
                                {!isCropping ? (
                                    <div className="lobby-profile-image-section">
                                        <div className="lobby-profile-image-container">
                                            <img 
                                                src={displayImage} 
                                                alt="Profile" 
                                                className="lobby-profile-image"
                                            />
                                            <button
                                                type="button"
                                                className="lobby-profile-image-edit"
                                                onClick={() => fileInputRef.current?.click()}
                                            >
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <circle cx="12" cy="12" r="10" fill="#144dff"/>
                                                    <path d="M14.5 7.5L16.5 9.5M8 16L8.5 13.5L14.5 7.5L16.5 9.5L10.5 15.5L8 16Z" fill="white" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                                                </svg>
                                            </button>
                                        </div>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            style={{ display: 'none' }}
                                        />
                                        <span className="lobby-profile-image-hint">Tap to change photo</span>
                                    </div>
                                ) : (
                                    <div className="lobby-profile-crop-section">
                                        <div className="lobby-profile-crop-container">
                                            <Cropper
                                                image={imagePreview}
                                                crop={crop}
                                                zoom={zoom}
                                                aspect={1}
                                                onCropComplete={handleCropComplete}
                                                onCropChange={setCrop}
                                                onZoomChange={setZoom}
                                                cropShape="round"
                                            />
                                        </div>
                                        <div className="lobby-profile-crop-actions">
                                            <button 
                                                type="button" 
                                                className="lobby-profile-btn-secondary"
                                                onClick={handleCancelCrop}
                                            >
                                                Cancel
                                            </button>
                                            <button 
                                                type="button" 
                                                className="lobby-profile-btn-primary"
                                                onClick={handleSaveCrop}
                                            >
                                                Save Crop
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Name Field */}
                                <div className="lobby-profile-field">
                                    <label className="lobby-profile-label">Name</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Your name"
                                        className="lobby-profile-input"
                                    />
                                </div>

                                {/* Email Field */}
                                <div className="lobby-profile-field">
                                    <label className="lobby-profile-label">
                                        Email
                                        {isEmailVerified && (
                                            <span className="lobby-profile-verified-badge">
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                                                    <path d="M5 13L9 17L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                                </svg>
                                                Verified
                                            </span>
                                        )}
                                    </label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="you@example.com"
                                        className={`lobby-profile-input ${isEmailVerified ? 'lobby-profile-input--readonly' : ''}`}
                                        disabled={isEmailVerified}
                                    />
                                    {isEmailVerified && (
                                        <span className="lobby-profile-field-hint">
                                            Verified emails cannot be changed
                                        </span>
                                    )}
                                </div>

                                {/* Contact URL Field */}
                                <div className="lobby-profile-field">
                                    <label className="lobby-profile-label">Contact URL</label>
                                    <input
                                        type="text"
                                        value={contactUrl}
                                        onChange={(e) => setContactUrl(e.target.value)}
                                        placeholder="linkedin.com/in/yourprofile"
                                        className="lobby-profile-input"
                                    />
                                    <span className="lobby-profile-field-hint">
                                        LinkedIn, Twitter, or any way to connect
                                    </span>
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    className="lobby-profile-submit"
                                    disabled={isSubmitting || isCropping}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="lobby-profile-spinner-small" />
                                            Saving...
                                        </>
                                    ) : (
                                        'Save Changes'
                                    )}
                                </button>
                            </form>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default LobbyProfileModal;
