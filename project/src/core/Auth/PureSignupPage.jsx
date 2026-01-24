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
    const [isTyping, setIsTyping] = useState(false);
    const [typingTimeout, setTypingTimeout] = useState(null);
    
    // Selfie modal state
    const [showSelfieModal, setShowSelfieModal] = useState(false);
    const [hasShownSelfieModal, setHasShownSelfieModal] = useState(false);
    const fileInputRef = useRef(null);

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

    // Auto-populate credentials for lobby users
    useEffect(() => {
        if (isLobbyRedirect && !username && !password) {
            const autoUsername = generateRandomString();
            const autoPassword = generateRandomString();
            
            setUsername(autoUsername);
            setPassword(autoPassword);
            
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
            
            // Skip to display name step
            setCurrentStep(2);
        }
    }, [isLobbyRedirect, username, password, displayName]);

    // Check if user is already authenticated when component mounts
    // Wait for auth loading to complete before checking, to avoid race conditions
    useEffect(() => {
        // Don't redirect while auth is still being checked
        if (isAuthLoading) return;
        
        // If user is authenticated, redirect them appropriately
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

    // Check if displayName is valid when currentStep changes to the display name step
    useEffect(() => {
        if (currentStep === 2 && displayName && validateDisplayName(displayName)) {
            setCanProceed(true);
            setFieldSuccess(prev => ({ ...prev, displayName: true }));
            setFieldErrors(prev => ({ ...prev, displayName: '' }));
        }
    }, [currentStep, displayName]);

    // Show selfie modal when arriving at image step (step 3)
    useEffect(() => {
        const isImageStep = currentStep === 3;
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
        // Trigger file picker after a brief delay for smooth transition
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
        // Regular expression to match only lowercase letters and numbers
        const validUsernameRegex = /^[a-z0-9]+$/;
        return username.length >= 2 && validUsernameRegex.test(username);
    };

    const validatePassword = (password) => {
        return password.length >= 2;
    };

    const validateDisplayName = (name) => {
        return name.length >= 2;
    };

    const handleNextStep = () => {
        if (currentStep < steps.length - 1) {
            // If we're on username step (0) and moving to password step (1)
            // and display name is empty, set it to username
            if (currentStep === 0 && !displayName) {
                setDisplayName(username);
                // Since we know the username is valid (as Next was clickable),
                // we can set the success state for display name
                setFieldSuccess(prev => ({ ...prev, displayName: true }));
                setFieldErrors(prev => ({ ...prev, displayName: '' }));
            }
            
            // If we're moving to the display name step and it's pre-filled
            if (currentStep === 1 && displayName && displayName.length >= 2) {
                setCanProceed(true);
            } else {
                setCanProceed(false);
            }
            
            setCurrentStep(prev => prev + 1);
        }
    };

    const handlePreviousStep = () => {
        if (currentStep > 0) {
            const previousStep = currentStep - 1;
            setCurrentStep(previousStep);
            
            // Check if the previous field was valid
            const previousField = steps[previousStep];
            if (previousField.validate) {
                const value = previousField.value;
                if (previousField.validate(value)) {
                    setCanProceed(true);
                }
            } else {
                // For non-validating fields (like file upload), maintain canProceed state
                setCanProceed(true);
            }
        }
    };

    const validateCurrentStep = () => {
        const currentField = steps[currentStep];
        if (!currentField.validate) return true;

        const value = currentField.value;
        if (currentField.validate(value)) {
            setFieldSuccess(prev => ({ ...prev, [currentField.id]: true }));
            setFieldErrors(prev => ({ ...prev, [currentField.id]: '' }));
            return true;
        } else {
            setFieldSuccess(prev => ({ ...prev, [currentField.id]: false }));
            setFieldErrors(prev => ({ ...prev, [currentField.id]: `Invalid ${currentField.label.toLowerCase()}` }));
            return false;
        }
    };

    const handleInputChange = (e, validateFn, setFieldFn) => {
        setFieldFn(e.target.value);
        const value = e.target.value;
        if (validateFn(value)) {
            setFieldSuccess(prev => ({ ...prev, [steps[currentStep].id]: true }));
            setFieldErrors(prev => ({ ...prev, [steps[currentStep].id]: '' }));
            setCanProceed(true);
        } else {
            setFieldSuccess(prev => ({ ...prev, [steps[currentStep].id]: false }));
            setFieldErrors(prev => ({ ...prev, [steps[currentStep].id]: `Must be at least 2 characters` }));
            setCanProceed(false);
        }
    };

    const handleUsernameChange = (e) => {
        // Convert input to lowercase and remove any non-alphanumeric characters
        const sanitizedValue = e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '');
        setUsername(sanitizedValue);
        
        if (validateUsername(sanitizedValue)) {
            setFieldSuccess(prev => ({ ...prev, username: true }));
            setFieldErrors(prev => ({ ...prev, username: '' }));
            setCanProceed(true);
        } else {
            setFieldSuccess(prev => ({ ...prev, username: false }));
            setFieldErrors(prev => ({ ...prev, username: 'Must be at least 2 characters' }));
            setCanProceed(false);
        }
    };

    const handlePasswordChange = (e) => {
        handleInputChange(e, validatePassword, setPassword);
    };

    const handleDisplayNameChange = (e) => {
        handleInputChange(e, validateDisplayName, setDisplayName);
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        // Quality control logging
        console.log('Signup attempt - Username:', username, 'Password:', password);
    
        if (!username || !password || !displayName) {
            setError('All fields are required');
            setIsLoading(false);
            return;
        }
    
        if (!profileImage || !imagePreview) {
            setError('Your profile picture is required👆🏼');
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
                body: JSON.stringify({ username, password }),
            });
    
            const userData = await response.json();
    
            if (userData.error === "Username already taken") {
                // If this is a lobby user with auto-generated credentials, regenerate and retry
                if (isLobbyRedirect) {
                    const newUsername = generateRandomString();
                    const newPassword = generateRandomString();
                    setUsername(newUsername);
                    setPassword(newPassword);
                    
                    // Retry with new credentials
                    const retryResponse = await apiFetch(endpoint, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ username: newUsername, password: newPassword }),
                    });
                    
                    const retryUserData = await retryResponse.json();
                    
                    if (!retryResponse.ok || retryUserData.error === "Username already taken") {
                        setError("Unable to create account. Please try again.");
                        setIsLoading(false);
                        return;
                    }
                    
                    // Continue with the retry data
                    login(retryUserData);
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

    const steps = [
        {
            id: 'username',
            label: 'Username',
            value: username,
            onChange: handleUsernameChange,
            type: 'text',
            placeholder: 'Enter a username',
            validate: validateUsername
        },
        {
            id: 'password',
            label: 'Password',
            value: password,
            onChange: handlePasswordChange,
            type: 'text',
            placeholder: 'Create a password',
            validate: validatePassword
        },
        {
            id: 'displayName',
            label: lobbyCode === 'demolobby' ? 'Display Name (Type Any Name)' : 'Display Name (what people will see)',
            value: displayName,
            onChange: handleDisplayNameChange,
            type: 'text',
            placeholder: 'Enter your preferred name',
            validate: validateDisplayName
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
    // This prevents showing the signup form briefly before redirecting authenticated users
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
                Already have an account? <a 
                    href="#" 
                    onClick={(e) => {
                        e.preventDefault();
                        navigate('/login');
                    }}
                    className="login-link"
                >
                    Login here
                </a>
            </p>

            <div className="step-form-container">
                <div className="step-progress">
                    {(isLobbyRedirect ? steps.slice(2) : steps).map((_, index) => (
                        <div
                            key={index}
                            className={`progress-dot ${
                                isLobbyRedirect 
                                    ? (index === currentStep - 2 ? 'active' : '') + (index < currentStep - 2 ? ' completed' : '')
                                    : (index === currentStep ? 'active' : '') + (index < currentStep ? ' completed' : '')
                            }`}
                        />
                    ))}
                </div>

                <form onSubmit={handleSubmit}>
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
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.1 }}
                                >
                                    <label className="step-label">
                                        {steps[currentStep].label}
                                    </label>
                                    
                                    <motion.div
                                        initial={{ opacity: 0, y: 4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{
                                            duration: 0.15,
                                            ease: "easeOut"
                                        }}
                                    >
                                        {steps[currentStep].type === 'file' ? (
                                            <div className="image-upload-container">
                                                {!isCropping ? (
                                                    <>
                                                        <input
                                                            ref={fileInputRef}
                                                            type="file"
                                                            onChange={steps[currentStep].onChange}
                                                            accept={steps[currentStep].accept}
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
                                        ) : (
                                            <input
                                                type={steps[currentStep].type}
                                                value={steps[currentStep].value}
                                                onChange={steps[currentStep].onChange}
                                                placeholder={steps[currentStep].placeholder}
                                                className="step-input"
                                                autoFocus
                                            />
                                        )}
                                    </motion.div>

                                    <AnimatePresence mode="wait">
                                        {fieldErrors[steps[currentStep].id] && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                transition={{ duration: 0.2 }}
                                                className="step-error"
                                            >
                                                {fieldErrors[steps[currentStep].id]}
                                            </motion.div>
                                        )}
                                        
                                        {fieldSuccess[steps[currentStep].id] && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.8 }}
                                                transition={{ duration: 0.2 }}
                                                className="step-success"
                                            >
                                                ✓ Valid
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            </div>

                            {!isCropping && (
                                <div className="button-container">
                                    {currentStep > 0 && (
                                        <motion.button
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 0.3 }}
                                            type="button"
                                            onClick={handlePreviousStep}
                                            className="backz-button"
                                        >
                                            ← Back
                                        </motion.button>
                                    )}
                                    {canProceed && currentStep < steps.length - 1 && (
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
                                📸 You Must Take a Selfie
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


