import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from './AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import getCroppedImg from '../cropImage'; // Utility function for cropping
import ReactCropper from 'react-easy-crop';
import { motion, AnimatePresence } from 'framer-motion';
import './PureSignupPage.css';

const PureSignupPage = () => {
    const { login, signup, user, logout, checkAuth } = useContext(AuthContext);
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

    const navigate = useNavigate();
    const location = useLocation();
    
    // Extract redirect parameter from URL
    const searchParams = new URLSearchParams(location.search);
    const redirectTo = searchParams.get('redirect');

    const validateUsername = (username) => {
        return username.length >= 2; // Simple minimum length check
    };

    const validatePassword = (password) => {
        return password.length >= 4;
    };

    const validateDisplayName = (name) => {
        return name.length >= 4;
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
            if (currentStep === 1 && displayName && displayName.length >= 4) {
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
        handleInputChange(e, validateUsername, setUsername);
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
            const response = await fetch(window.server_url + endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ username, password }),
                mode: 'cors'
            });
    
            const userData = await response.json();
    
            if (userData.error === "Username already taken") {
                setError("Username is taken");
                setIsLoading(false);
                return;
            }
    
            if (!response.ok) {
                setError(userData.message || 'Signup failed');
                setIsLoading(false);
                return;
            }
    
            login(userData);
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
    
            const profileCreation = await fetch(`${window.server_url}/update_profile`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
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
                navigate('/lobby');
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
            label: 'Display Name',
            value: displayName,
            onChange: handleDisplayNameChange,
            type: 'text',
            placeholder: 'Enter your preferred name',
            validate: validateDisplayName
        },
        {
            id: 'image',
            label: 'Profile Picture',
            type: 'file',
            onChange: handleImageChange,
            accept: 'image/*'
        }
    ];

    return (
        <div className="signup-container">
            <button 
                onClick={() => navigate('/')} 
                className="homescreen-button"
            >
                Home
            </button>

            <img 
                src="/assets/reunio-game-logo-3.png"
                alt="Reunio Logo"
                className="logo-image"
                style={{width: '100px',height: '100px',objectFit: 'contain'}}
            />

            <h3 className="signup-header">Sign Up to Join</h3>

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
                    {steps.map((_, index) => (
                        <div
                            key={index}
                            className={`progress-dot ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}
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
                                                            type="file"
                                                            onChange={steps[currentStep].onChange}
                                                            accept={steps[currentStep].accept}
                                                            className="step-input"
                                                        />
                                                        {imagePreview && (
                                                            <div className="image-preview" style={{ marginTop: '50px' }}>
                                                                <img
                                                                    src={imagePreview}
                                                                    alt="Profile preview"
                                                                    style={{
                                                                        width: '100%',
                                                                        height: '200px',
                                                                        objectFit: 'cover',
                                                                        borderRadius: '12px',
                                                                        marginTop: '15px'
                                                                    }}
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
                                                                onClick={handleSaveCroppedImage}
                                                                className="save-crop-button"
                                                            >
                                                                Good
                                                            </button>
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
                                            style={{
                                                marginRight: '10px'
                                            }}
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
                                            style={{
                                                marginLeft: '10px'
                                            }}
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
                            style={{
                        backgroundColor: '#ffebee',
                        color: '#d32f2f',
                        padding: '10px',
                        borderRadius: '10px',
                        marginBottom: '15px',
                        textAlign: 'center',
                        border: '1px solid #ef9a9a',
                        animation: 'shake 0.5s ease-in-out',
                        fontSize: '0.9rem'
                            }}
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
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '25px',
                                border: 'none',
                                background: 'linear-gradient(45deg, #144dff, #2979ff)',
                                color: 'white',
                                fontSize: '1rem',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                boxShadow: '0 4px 15px rgba(20,77,255,0.2)',
                                marginTop: '0px'
                            }}
                        >
                            {isLoading ? 'Loading...' : 'Complete Signup'}
                        </motion.button>
                    )}
                </form>
            </div>
        </div>
    );
};

export default PureSignupPage;


