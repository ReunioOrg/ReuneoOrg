import React, { useContext, useState, useEffect, useRef } from 'react';
import { AuthContext } from './AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import getCroppedImg from '../cropImage'; // Utility function for cropping
import ReactCropper from 'react-easy-crop';
import { motion, AnimatePresence } from 'framer-motion';
import './PureSignupPage.css';
import { apiFetch } from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';

const PureSignupPage = () => {
    const { login, signup, user, logout, checkAuth, isAuthLoading, authLoadingMessage } = useContext(AuthContext);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [profileImage, setProfileImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [error, setError] = useState('');
    const [currentStep, setCurrentStep] = useState(0);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [cropArea, setCropArea] = useState(null);
    const [isCropping, setIsCropping] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});
    const [fieldSuccess, setFieldSuccess] = useState({});
    const [canProceed, setCanProceed] = useState(false);
    
    // Selfie modal state
    const [showSelfieModal, setShowSelfieModal] = useState(false);
    const [hasShownSelfieModal, setHasShownSelfieModal] = useState(false);
    const fileInputRef = useRef(null);
    
    // Collapsible credentials section state (for lobby redirect users)
    const [credentialsExpanded, setCredentialsExpanded] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();
    
    // Extract redirect parameter from URL
    const searchParams = new URLSearchParams(location.search);
    const redirectTo = searchParams.get('redirect');
    const lobbyCode = searchParams.get('code');

    // Check if user was redirected from lobby
    const isLobbyRedirect = redirectTo === 'lobby';

    // Auto-generate credentials for lobby users
    const generateRandomString = () => {
        const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < 10; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    };

    // Auto-populate credentials for lobby users (no step skipping - just pre-fill)
    // Uses SAME value for both username and password (easier to remember/screenshot)
    useEffect(() => {
        if (isLobbyRedirect && !username && !password) {
            const autoCredential = generateRandomString();
            
            setUsername(autoCredential);
            setPassword(autoCredential);
            
            // Set success states for auto-generated credentials
            setFieldSuccess(prev => ({ 
                ...prev, 
                username: true, 
                password: true 
            }));
            setFieldErrors(prev => ({ 
                ...prev, 
                username: '', 
                password: '' 
            }));
            // Note: canProceed stays false until user enters displayName
        }
    }, [isLobbyRedirect]);

    // Check if user is already authenticated when component mounts
    useEffect(() => {
        if (isAuthLoading) return;
        
        if (user) {
            if (redirectTo === 'lobby') {
                if (lobbyCode) {
                    navigate(`/lobby?code=${lobbyCode}`);
                } else {
                    navigate('/?showLobbyModal=true');
                }
            } else if (redirectTo === 'product-selection') {
                navigate('/product-selection');
            } else {
                navigate('/');
            }
        }
    }, [isAuthLoading, user, redirectTo, lobbyCode, navigate]);

    // Show selfie modal when arriving at image step (step 1 in new flow)
    useEffect(() => {
        const isImageStep = currentStep === 1;
        const isNotDemoLobby = lobbyCode !== 'demolobby';
        const allPreviousFieldsFilled = username && password && displayName;
        
        if (isImageStep && isNotDemoLobby && allPreviousFieldsFilled && !hasShownSelfieModal) {
            setShowSelfieModal(true);
            setHasShownSelfieModal(true);
        }
    }, [currentStep, lobbyCode, username, password, displayName, hasShownSelfieModal]);

    // Handle selfie modal "Understood" click
    const handleSelfieModalUnderstood = () => {
        setShowSelfieModal(false);
        setTimeout(() => {
            if (fileInputRef.current) {
                fileInputRef.current.click();
            }
        }, 150);
    };

    // Handle clicking outside the modal (overlay click)
    const handleSelfieModalOverlayClick = () => {
        setShowSelfieModal(false);
    };

    const validateUsername = (username) => {
        const validUsernameRegex = /^[a-z0-9]+$/;
        return username.length >= 2 && validUsernameRegex.test(username);
    };

    const validatePassword = (password) => {
        return password.length >= 2;
    };

    const validateDisplayName = (name) => {
        return name.length >= 2;
    };

    // Helper to update canProceed for combined step (step 0)
    const updateCanProceedForCombinedStep = (newDisplayName, newUsername, newPassword) => {
        const allValid = 
            validateDisplayName(newDisplayName) && 
            validateUsername(newUsername) && 
            validatePassword(newPassword);
        setCanProceed(allValid);
    };

    const handleNextStep = () => {
        if (currentStep < steps.length - 1) {
            setCanProceed(false); // Reset for next step
            setCurrentStep(prev => prev + 1);
        }
    };

    const handlePreviousStep = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
            // When going back to step 0, recalculate canProceed
            if (currentStep === 1) {
                updateCanProceedForCombinedStep(displayName, username, password);
            }
        }
    };

    const handleUsernameChange = (e) => {
        const sanitizedValue = e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '');
        setUsername(sanitizedValue);
        
        if (validateUsername(sanitizedValue)) {
            setFieldSuccess(prev => ({ ...prev, username: true }));
            setFieldErrors(prev => ({ ...prev, username: '' }));
        } else {
            setFieldSuccess(prev => ({ ...prev, username: false }));
            setFieldErrors(prev => ({ ...prev, username: 'Must be at least 2 characters (letters and numbers only)' }));
        }
        
        // Update canProceed for combined step
        updateCanProceedForCombinedStep(displayName, sanitizedValue, password);
    };

    const handlePasswordChange = (e) => {
        const value = e.target.value;
        setPassword(value);
        
        if (validatePassword(value)) {
            setFieldSuccess(prev => ({ ...prev, password: true }));
            setFieldErrors(prev => ({ ...prev, password: '' }));
        } else {
            setFieldSuccess(prev => ({ ...prev, password: false }));
            setFieldErrors(prev => ({ ...prev, password: 'Must be at least 2 characters' }));
        }
        
        // Update canProceed for combined step
        updateCanProceedForCombinedStep(displayName, username, value);
    };

    const handleDisplayNameChange = (e) => {
        const value = e.target.value;
        setDisplayName(value);
        
        if (validateDisplayName(value)) {
            setFieldSuccess(prev => ({ ...prev, displayName: true }));
            setFieldErrors(prev => ({ ...prev, displayName: '' }));
        } else {
            setFieldSuccess(prev => ({ ...prev, displayName: false }));
            setFieldErrors(prev => ({ ...prev, displayName: 'Must be at least 2 characters' }));
        }
        
        // Update canProceed for combined step
        updateCanProceedForCombinedStep(value, username, password);
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    let width = img.width;
                    let height = img.height;
                    const maxDimension = 1500;

                    if (width > height && width > maxDimension) {
                        height = (height * maxDimension) / width;
                        width = maxDimension;
                    } else if (height > width && height > maxDimension) {
                        width = (width * maxDimension) / height;
                        height = maxDimension;
                    }

                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    const resizedImage = canvas.toDataURL('image/jpeg', 0.75);
                    setProfileImage(file);
                    setImagePreview(resizedImage);
                    setIsCropping(true);
                    setFieldSuccess(prev => ({ ...prev, image: true }));
                    setFieldErrors(prev => ({ ...prev, image: '' }));
                    setCanProceed(true);
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleCropComplete = (croppedArea, croppedAreaPixels) => {
        setCropArea(croppedAreaPixels);
    };

    const handleSaveCroppedImage = async () => {
        try {
            const croppedImage = await getCroppedImg(imagePreview, cropArea);
            setImagePreview(croppedImage);
            setIsCropping(false);
        } catch (error) {
            console.error('Error cropping the image:', error);
            setError('Failed to crop image. Please try again.');
        }
    };

    // Web Credentials API - save credentials to password manager
    const saveCredentialsToPasswordManager = async (user, pass, name) => {
        if ('credentials' in navigator && window.PasswordCredential) {
            try {
                const credential = new PasswordCredential({
                    id: user,
                    password: pass,
                    name: name
                });
                await navigator.credentials.store(credential);
                console.log('Credentials saved to password manager');
            } catch (err) {
                console.warn('Could not save credentials:', err);
                // Non-blocking - continue even if this fails
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        console.log('Signup attempt - Username:', username, 'Password:', password);
    
        if (!username || !password || !displayName) {
            setError('All fields are required');
            setIsLoading(false);
            return;
        }
    
        if (!profileImage || !imagePreview) {
            setError('Your profile picture is required');
            setIsLoading(false);
            return;
        }
    
        try {
            const endpoint = '/signup';
            const response = await apiFetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    username, 
                    password,
                    is_lobby_signup: isLobbyRedirect
                }),
            });
    
            const userData = await response.json();
    
            // Track which credentials to save (may change in retry scenario)
            let finalUsername = username;
            let finalPassword = password;
    
            if (userData.error === "Username already taken") {
                if (isLobbyRedirect) {
                    // Use same value for both username and password on retry
                    const newCredential = generateRandomString();
                    const newUsername = newCredential;
                    const newPassword = newCredential;
                    setUsername(newUsername);
                    setPassword(newPassword);
                    
                    const retryResponse = await apiFetch(endpoint, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ 
                            username: newUsername, 
                            password: newPassword,
                            is_lobby_signup: true
                        }),
                    });
                    
                    const retryUserData = await retryResponse.json();
                    
                    if (!retryResponse.ok || retryUserData.error === "Username already taken") {
                        setError("Unable to create account. Please try again.");
                        setIsLoading(false);
                        return;
                    }
                    
                    login(retryUserData);
                    // Use the new credentials for password manager
                    finalUsername = newUsername;
                    finalPassword = newPassword;
                } else {
                    setError("Username is taken");
                    setIsLoading(false);
                    return;
                }
            } else {
                if (!response.ok) {
                    setError(userData.message || 'Signup failed');
                    setIsLoading(false);
                    return;
                }
                login(userData);
            }
    
            await checkAuth();
    
            const token = localStorage.getItem('access_token');
            if (!token) {
                throw new Error('Authentication failed');
            }
    
            let base64Image = null;
            if (profileImage) {
                base64Image = imagePreview;
                base64Image = base64Image.split(',')[1];
            } else {
                const response = await fetch('/assets/fakeprofile.png');
                const blob = await response.blob();
                const imageBuffer = await blob.arrayBuffer();
                base64Image = btoa(
                    new Uint8Array(imageBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
                );
            }
    
            const profileCreation = await apiFetch('/update_profile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: displayName,
                    image_data: base64Image
                }),
            });
    
            if (!profileCreation.ok) {
                throw new Error('Failed to update profile');
            }
    
            await checkAuth();
            
            // Save credentials to password manager before navigating
            await saveCredentialsToPasswordManager(finalUsername, finalPassword, displayName);
            
            if (redirectTo === 'lobby') {
                if (lobbyCode) {
                    navigate(`/lobby?code=${lobbyCode}`);
                } else {
                    navigate('/?showLobbyModal=true');
                }
            } else if (redirectTo === 'product-selection') {
                navigate('/product-selection');
            } else {
                navigate('/');
            }
    
        } catch (error) {
            console.error('Error:', error);
            setError('An error occurred. Please try again.');
        }
    
        setIsLoading(false);
    };

    // Simplified 2-step structure
    const steps = [
        {
            id: 'credentials',
            type: 'combined'
        },
        {
            id: 'image',
            label: lobbyCode === 'demolobby' ? 'Profile Image (Upload Any Image)' : 'Take a Selfie (so people can find you)',
            type: 'file',
            onChange: handleImageChange,
            accept: 'image/*'
        }
    ];

    // Show loading spinner while auth is being checked
    if (isAuthLoading) {
        return <LoadingSpinner fullScreen message={authLoadingMessage} />;
    }

    return (
        <div className="signup-container">
            <button 
                onClick={() => navigate('/')} 
                className="homescreen-button"
            >
                Home
            </button>

            <img 
                src="/assets/reuneo_test_8.png"
                alt="Reunio Logo"
                className="logo-image"
            />

            <h3 className="signup-header">
                {lobbyCode === 'demolobby' ? 'Join the demo' : 'Sign Up to Join'}
            </h3>

            {lobbyCode && lobbyCode !== 'demolobby' && (
                <h2 className="signup-header">{lobbyCode} lobby</h2>
            )}
            
            {lobbyCode === 'demolobby' && (
                <h2 className="signup-header" style={{ fontSize: '0.9rem' }}>Try Reuneo for Free!</h2>
            )}

            <p className="login-link-text">
                Already have an account?
            </p>
            <button
                type="button"
                onClick={() => navigate('/login')}
                className="login-cta-button"
            >
                I already have an account
            </button>

            <div className="step-form-container">
                <div className="step-progress">
                    {steps.map((_, index) => (
                        <div
                            key={index}
                            className={`progress-dot ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}
                        />
                    ))}
                </div>

                <form onSubmit={handleSubmit} autoComplete="on">
                    <AnimatePresence mode="wait" initial={false}>
                        <motion.div
                            key={currentStep}
                            initial={{ opacity: 0, x: 8 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -8 }}
                            transition={{
                                type: "spring",
                                stiffness: 500,
                                damping: 25,
                                mass: 0.3
                            }}
                            className="step active"
                            style={{ willChange: 'transform, opacity' }}
                        >
                            <div className="step-content">
                                {/* Step 0: Combined credentials step */}
                                {currentStep === 0 && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.1 }}
                                        className="credentials-step"
                                    >
                                        {/* Name Field - Primary Focus */}
                                        <div className="name-field-container">
                                            <label className="step-label">
                                                {lobbyCode === 'demolobby' ? 'Your Name (Type Any Name)' : 'Your Name'}
                                            </label>
                                            <input
                                                type="text"
                                                name="displayName"
                                                autoComplete="name"
                                                value={displayName}
                                                onChange={handleDisplayNameChange}
                                                placeholder="Enter your name"
                                                className="step-input"
                                                autoFocus
                                            />
                                            <AnimatePresence mode="wait">
                                                {fieldErrors.displayName && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: -5 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: -5 }}
                                                        className="step-error"
                                                    >
                                                        {fieldErrors.displayName}
                                                    </motion.div>
                                                )}
                                                {fieldSuccess.displayName && !fieldErrors.displayName && (
                                                    <motion.div
                                                        initial={{ opacity: 0, scale: 0.8 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        exit={{ opacity: 0, scale: 0.8 }}
                                                        className="step-success"
                                                    >
                                                        ✓ Valid
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>

                                        {/* Next Button - Positioned below name, above credentials */}
                                        {canProceed && (
                                            <div className="inline-next-button-container">
                                                <motion.button
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: 0.2 }}
                                                    type="button"
                                                    onClick={handleNextStep}
                                                    className="inline-next-button"
                                                >
                                                    Continue →
                                                </motion.button>
                                            </div>
                                        )}

                                        {/* Username/Password - Collapsible for lobby, normal for regular */}
                                        {isLobbyRedirect ? (
                                            <div className="credentials-collapsible">
                                                <p className="credentials-hint">
                                                    Auto-generated login (edit if you want)
                                                </p>
                                                <button
                                                    type="button"
                                                    className="see-more-toggle"
                                                    onClick={() => setCredentialsExpanded(!credentialsExpanded)}
                                                >
                                                    {credentialsExpanded ? 'Hide ▲' : 'See More ▼'}
                                                </button>
                                                
                                                {credentialsExpanded && (
                                                    <motion.div
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: 'auto' }}
                                                        exit={{ opacity: 0, height: 0 }}
                                                        transition={{ duration: 0.2 }}
                                                        className="credentials-fields-expanded"
                                                    >
                                                        <div className="field-row">
                                                            <label className="step-label small-label">Username</label>
                                                            <input
                                                                type="text"
                                                                name="username"
                                                                autoComplete="username"
                                                                value={username}
                                                                onChange={handleUsernameChange}
                                                                placeholder="Choose a username"
                                                                className="step-input"
                                                            />
                                                            {fieldErrors.username && (
                                                                <div className="step-error small-feedback">{fieldErrors.username}</div>
                                                            )}
                                                            {fieldSuccess.username && !fieldErrors.username && (
                                                                <div className="step-success small-feedback">✓ Valid</div>
                                                            )}
                                                        </div>
                                                        
                                                        <div className="field-row">
                                                            <label className="step-label small-label">Password</label>
                                                            <input
                                                                type="password"
                                                                name="password"
                                                                autoComplete="new-password"
                                                                value={password}
                                                                onChange={handlePasswordChange}
                                                                placeholder="Create a password"
                                                                className="step-input"
                                                            />
                                                            {fieldErrors.password && (
                                                                <div className="step-error small-feedback">{fieldErrors.password}</div>
                                                            )}
                                                            {fieldSuccess.password && !fieldErrors.password && (
                                                                <div className="step-success small-feedback">✓ Valid</div>
                                                            )}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="credentials-fields">
                                                <div className="field-row">
                                                    <label className="step-label small-label">Username</label>
                                                    <input
                                                        type="text"
                                                        name="username"
                                                        autoComplete="username"
                                                        value={username}
                                                        onChange={handleUsernameChange}
                                                        placeholder="Choose a username"
                                                        className="step-input"
                                                    />
                                                    {fieldErrors.username && (
                                                        <div className="step-error small-feedback">{fieldErrors.username}</div>
                                                    )}
                                                    {fieldSuccess.username && !fieldErrors.username && (
                                                        <div className="step-success small-feedback">✓ Valid</div>
                                                    )}
                                                </div>
                                                
                                                <div className="field-row">
                                                    <label className="step-label small-label">Password</label>
                                                    <input
                                                        type="password"
                                                        name="password"
                                                        autoComplete="new-password"
                                                        value={password}
                                                        onChange={handlePasswordChange}
                                                        placeholder="Create a password"
                                                        className="step-input"
                                                    />
                                                    {fieldErrors.password && (
                                                        <div className="step-error small-feedback">{fieldErrors.password}</div>
                                                    )}
                                                    {fieldSuccess.password && !fieldErrors.password && (
                                                        <div className="step-success small-feedback">✓ Valid</div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </motion.div>
                                )}

                                {/* Step 1: Image upload step */}
                                {currentStep === 1 && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.1 }}
                                    >
                                        {/* Inline Back button for image step */}
                                        <div className="inline-back-button-container">
                                            <motion.button
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: 0.2 }}
                                                type="button"
                                                onClick={handlePreviousStep}
                                                className="inline-back-button"
                                            >
                                                ← Back
                                            </motion.button>
                                        </div>

                                        <label className="step-label">
                                            {steps[1].label}
                                        </label>
                                        
                                        <div className="image-upload-container">
                                            {!isCropping ? (
                                                <>
                                                    <input
                                                        ref={fileInputRef}
                                                        type="file"
                                                        onChange={handleImageChange}
                                                        accept="image/*"
                                                        className="step-input"
                                                    />
                                                    {imagePreview && (
                                                        <div>
                                                            <img
                                                                src={imagePreview}
                                                                alt="Profile preview"
                                                                className="profile-preview-image"
                                                            />
                                                        </div>
                                                    )}
                                                </>
                                            ) : (
                                                <div className="cropper-container">
                                                    <div className="cropper-wrapper">
                                                        <ReactCropper
                                                            image={imagePreview}
                                                            crop={crop}
                                                            zoom={zoom}
                                                            aspect={1}
                                                            onCropComplete={handleCropComplete}
                                                            onCropChange={setCrop}
                                                            onZoomChange={setZoom}
                                                        />
                                                    </div>
                                                    <div className="cropper-controls">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setIsCropping(false);
                                                                setImagePreview(null);
                                                                setProfileImage(null);
                                                            }}
                                                            className="cancel-crop-button"
                                                        >
                                                            Cancel
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={handleSaveCroppedImage}
                                                            className="save-crop-button"
                                                        >
                                                            Good
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </div>

                            {!isCropping && (
                                <div className={`button-container ${currentStep === 0 ? 'combined-step-buttons' : ''}`}>
                                    {/* Back button hidden - using inline back buttons in each step now */}
                                    {/* Next button only shown here for steps > 0 (step 0 has inline button) */}
                                    {canProceed && currentStep > 0 && currentStep < steps.length - 1 && (
                                        <motion.button
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 0.3 }}
                                            type="button"
                                            onClick={handleNextStep}
                                            className="nextz-button"
                                        >
                                            Next →
                                        </motion.button>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="error-message"
                        >
                            {error}
                        </motion.div>
                    )}

                    {currentStep === steps.length - 1 && (
                        <motion.button 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            type="submit" 
                            className="primary-button"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Loading...' : 'Complete Signup'}
                        </motion.button>
                    )}
                </form>
            </div>

            {/* Selfie Reminder Modal */}
            <AnimatePresence>
                {showSelfieModal && (
                    <motion.div
                        className="selfie-modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={handleSelfieModalOverlayClick}
                    >
                        <motion.div
                            className="selfie-modal-content"
                            initial={{ opacity: 0, scale: 0.85 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.85 }}
                            transition={{ 
                                type: "spring",
                                stiffness: 400,
                                damping: 25
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h2 className="selfie-modal-header">
                                You Must Take a Selfie
                            </h2>
                            <p className="selfie-modal-subtext">
                                Don't use old photos, people need to know how you look in order to find you in the room - trust us.
                            </p>
                            <button
                                type="button"
                                className="selfie-modal-button"
                                onClick={handleSelfieModalUnderstood}
                            >
                                Understood
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default PureSignupPage;
