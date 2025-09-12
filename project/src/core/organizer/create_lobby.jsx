import React, { useEffect, useState, useRef } from 'react';
import { AuthContext } from '../Auth/AuthContext';
import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../cropImage';
import './create_lobby.css';

const CreateLobbyView = () => {
    const { user, userProfile, checkAuth, permissions } = useContext(AuthContext);
    const [title, setTitle] = useState('');
    const [lobbyCode, setLobbyCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [customTags, setCustomTags] = useState([]);
    const [tagInput, setTagInput] = useState('');
    const [minutes, setMinutes] = useState('5');
    const [seconds, setSeconds] = useState('0');
    const [showTableNumbers, setShowTableNumbers] = useState(false);
    
    // Logo upload states
    const [logoImage, setLogoImage] = useState(null);
    const [logoName, setLogoName] = useState('');
    const [logoUrl, setLogoUrl] = useState('');
    const [logoPreview, setLogoPreview] = useState(null);
    const [logoCroppedImage, setLogoCroppedImage] = useState(null);
    const [logoError, setLogoError] = useState('');
    const [isLogoCropping, setIsLogoCropping] = useState(false);
    const [isLogoProcessing, setIsLogoProcessing] = useState(false);
    const [logoCrop, setLogoCrop] = useState({ x: 0, y: 0 });
    const [logoZoom, setLogoZoom] = useState(1);
    const [logoCropArea, setLogoCropArea] = useState(null);

    const MaxLobbyDuration = 8 * 60;
    const MaxMinutes = 8;

    const navigate = useNavigate();
    const inputRef = useRef(null);

    useEffect(() => {
        // Scroll to top when component mounts
        window.scrollTo(0, 0);
        
        // Auto-populate title and lobby code with username when component mounts
        if (user) {
            setTitle(user);
            setLobbyCode(user);
        }
        
        // Focus on the input field when component mounts
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, [user]);

    // Function to validate lobby code (only lowercase letters and numbers allowed)
    const validateLobbyCode = (code) => {
        // Regular expression to match only lowercase letters and numbers
        const validLobbyCodeRegex = /^[a-z0-9]+$/;
        return code.length >= 2 && validLobbyCodeRegex.test(code);
    };

    // Handle lobby code input change with validation
    const handleLobbyCodeChange = (e) => {
        // Convert input to lowercase and remove any non-alphanumeric characters
        const sanitizedValue = e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '');
        setLobbyCode(sanitizedValue);
        setIsTyping(true);
        
        // Reset typing state after a delay
        setTimeout(() => {
            setIsTyping(false);
        }, 500);
    };

    // Handle adding a tag to the customTags list
    const handleAddTag = () => {
        if (tagInput.trim() && !customTags.includes(tagInput.trim())) {
            setCustomTags([...customTags, tagInput.trim()]);
            setTagInput('');
        }
    };

    // Handle removing a tag from the customTags list
    const handleRemoveTag = (tagToRemove) => {
        setCustomTags(customTags.filter(tag => tag !== tagToRemove));
    };

    // Handle tag input keydown (add tag on Enter)
    const handleTagKeyDown = (e) => {
        if (e.key === 'Enter' && tagInput.trim()) {
            e.preventDefault(); // Prevent form submission
            handleAddTag();
        }
    };

    // Logo upload functions
    const resizeImage = (file, maxWidth, maxHeight) => {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                let { width, height } = img;
                
                // Calculate new dimensions while maintaining aspect ratio
                if (width > height) {
                    if (width > maxWidth) {
                        height = (height * maxWidth) / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = (width * maxHeight) / height;
                        height = maxHeight;
                    }
                }
                
                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);
                
                const resizedImage = canvas.toDataURL('image/jpeg', 0.7);
                resolve(resizedImage);
            };
            img.src = URL.createObjectURL(file);
        });
    };

    const handleLogoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setLogoError('');
        setIsLogoProcessing(true);

        // Validate file type
        if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
            setLogoError('Invalid format. Please upload a JPG or PNG image.');
            setIsLogoProcessing(false);
            return;
        }

        // Validate file size (2MB)
        if (file.size > 2 * 1024 * 1024) {
            setLogoError('File too large. Please choose an image under 2MB.');
            setIsLogoProcessing(false);
            return;
        }

        try {
            // Resize image to fit 400x400 max
            const resizedImage = await resizeImage(file, 400, 400);
            
            setLogoImage(file);
            setLogoPreview(resizedImage);
            setIsLogoCropping(true);
            setIsLogoProcessing(false);
        } catch (error) {
            console.error('Error processing image:', error);
            setLogoError('Error processing image. Please try again.');
            setIsLogoProcessing(false);
        }
    };

    const handleLogoCropComplete = (croppedArea, croppedAreaPixels) => {
        setLogoCropArea(croppedAreaPixels);
    };

    const handleSaveLogoCrop = async () => {
        try {
            setIsLogoProcessing(true);
            const croppedImage = await getCroppedImg(logoPreview, logoCropArea);
            setLogoCroppedImage(croppedImage);
            setIsLogoCropping(false);
            setIsLogoProcessing(false);
        } catch (error) {
            console.error('Error cropping logo:', error);
            setLogoError('Error processing image. Please try again.');
            setIsLogoCropping(false);
            setIsLogoProcessing(false);
        }
    };

    const handleRemoveLogo = () => {
        setLogoImage(null);
        setLogoPreview(null);
        setLogoCroppedImage(null);
        setIsLogoCropping(false);
        setIsLogoProcessing(false);
        setLogoCrop({ x: 0, y: 0 });
        setLogoZoom(1);
        setLogoCropArea(null);
        setLogoError('');
        // Reset file input
        const fileInput = document.getElementById('logoUpload');
        if (fileInput) fileInput.value = '';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validate lobby code before submission
        if (!validateLobbyCode(lobbyCode)) {
            setError("Lobby code must be at least 2 characters long and contain only lowercase letters and numbers");
            return;
        }
        
        setIsLoading(true);
        setError('');

        // Calculate total duration in seconds
        const lobbyDuration = (parseInt(minutes) * 60) + parseInt(seconds);

        // Prepare logo data
        let logoIconData = null;
        if (logoCroppedImage) {
            // Remove the data:image/jpeg;base64, prefix for the API
            logoIconData = logoCroppedImage.split(',')[1];
        }

        try {
            const requestBody = {
                lobby_code: lobbyCode,
                custom_tags: customTags,
                lobby_duration: lobbyDuration,
                show_table_numbers: showTableNumbers
            };

            // Add logo data if provided
            if (logoIconData) {
                requestBody.logo_icon = logoIconData;
            }
            if (logoName.trim()) {
                requestBody.logo_name = logoName.trim();
            }
            if (logoUrl.trim()) {
                requestBody.logo_hyperlink = logoUrl.trim();
            }

            const response = await fetch(window.server_url + '/create_lobby', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (response.ok) {
                console.log("Lobby created successfully");
                console.log(await response.json());
                // Navigate to the lobby with the correct URL format
                navigate(`/admin_lobby_view?code=${lobbyCode}`);
            } else {
                const data = await response.json();
                setError(data.message || "Failed to create lobby");
                console.error("Failed to create lobby");
            }
        } catch (err) {
            setError("An error occurred while creating the lobby");
            console.error("Error creating lobby:", err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="create-lobby-background">
            <img 
                src="/assets/reuneo_test_9.png"
                alt="Reunio Logo"
                className="logo-image"
                onClick={() => navigate(-1)}
            />
            <div className="create-lobby-container">
                <h1 className="create-lobby-title">Create a New Lobby</h1>
                
                <form onSubmit={handleSubmit} className="create-lobby-form">
                    <div className="form-group">
                        <label htmlFor="lobbyCode">Lobby Code</label>
                        <input
                            ref={inputRef}
                            type="text"
                            id="lobbyCode"
                            value={lobbyCode}
                            onChange={handleLobbyCodeChange}
                            placeholder="Enter lobby code (lowercase letters and numbers only)"
                            required
                            className={`form-input ${isTyping ? 'typing' : ''}`}
                            autoComplete="off"
                        />
                        <div className="input-hint">lowercase letters and numbers only</div>
                    </div>
                    
                    <div className="form-group">
                        <label>Round Duration</label>
                        <div className="duration-input-container">
                            <div className="duration-input-group">
                                <input
                                    type="number"
                                    id="minutes"
                                    value={minutes}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        if (value === '' || (parseInt(value) > 0 && parseInt(value) <= MaxMinutes)) {
                                            setMinutes(value);
                                            // Reset seconds to 0 if minutes is 5
                                            if (parseInt(value) === MaxMinutes) {
                                                setSeconds('0');
                                            }
                                        }
                                    }}
                                    min="1"
                                    max={MaxMinutes}
                                    placeholder={`1-${MaxMinutes}`}
                                    className="form-input duration-input"
                                    autoComplete="off"
                                />
                                <label htmlFor="minutes" className="duration-label">Minutes</label>
                            </div>
                            <div className="duration-input-group">
                                <input
                                    type="number"
                                    id="seconds"
                                    value={seconds}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        if (value === '' || (parseInt(value) >= 0 && parseInt(value) <= 59)) {
                                            setSeconds(value);
                                        }
                                    }}
                                    min="0"
                                    max="59"
                                    placeholder="0-59"
                                    className="form-input duration-input"
                                    autoComplete="off"
                                    disabled={parseInt(minutes) === MaxMinutes}
                                />
                                <label htmlFor="seconds" className="duration-label">Seconds</label>
                            </div>
                        </div>
                        <div className="input-hint">Maximum total duration is {MaxMinutes} minutes</div>
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="showTableNumbers">Table Numbers</label>
                        <input
                            type="checkbox"
                            id="showTableNumbers"
                            checked={showTableNumbers}
                            onChange={(e) => setShowTableNumbers(e.target.checked)}
                            className="form-input checkbox-input"
                        />
                        <div className="input-hint">Recommended for events with 50+ people</div>
                        <div className="input-hint">Make sure to provide table numbers</div>
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="tagInput">Matchmaking Categories</label>
                        <div className="tag-input-container">
                            <input
                                type="text"
                                id="tagInput"
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={handleTagKeyDown}
                                placeholder="Add categories (press + to add)"
                                className="form-input"
                                autoComplete="off"
                            />
                            <button 
                                type="button" 
                                onClick={handleAddTag}
                                className="tag-add-button"
                            >
                                +
                            </button>
                        </div>
                        
                        {customTags.length > 0 && (
                            <div className="tag-list">
                                {customTags.map((tag, index) => (
                                    <div key={index} className="tag-item">
                                        {tag}
                                        <button 
                                            type="button" 
                                            onClick={() => handleRemoveTag(tag)}
                                            className="tag-remove-button"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="input-hint">If you want to match people based on categories</div>
                    </div>
                    
                    <div className="form-group logo-upload-section">
                        <label>Sponsor Logo</label>
                        
                        {/* Upload Button / Processing State */}
                        {!logoCroppedImage && !isLogoCropping && (
                            <>
                                {isLogoProcessing ? (
                                    <div className="logo-processing">Processing...</div>
                                ) : (
                                    <>
                                        <input
                                            type="file"
                                            id="logoUpload"
                                            accept="image/jpeg,image/jpg,image/png"
                                            onChange={handleLogoUpload}
                                            style={{ display: 'none' }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => document.getElementById('logoUpload').click()}
                                            className="logo-upload-button"
                                        >
                                            Upload Logo
                                        </button>
                                    </>
                                )}
                                {logoError && <div className="logo-error-message">{logoError}</div>}
                            </>
                        )}
                        
                        {/* Inline Cropping Interface */}
                        {isLogoCropping && logoPreview && (
                            <div className="logo-crop-container">
                                <div className="logo-crop-area">
                                    <Cropper
                                        image={logoPreview}
                                        crop={logoCrop}
                                        zoom={logoZoom}
                                        aspect={1}
                                        onCropChange={setLogoCrop}
                                        onZoomChange={setLogoZoom}
                                        onCropComplete={handleLogoCropComplete}
                                    />
                                </div>
                                <div className="logo-crop-controls">
                                    <button
                                        type="button"
                                        onClick={handleSaveLogoCrop}
                                        className="logo-save-button"
                                        disabled={isLogoProcessing}
                                    >
                                        {isLogoProcessing ? 'Processing...' : 'Save Crop'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleRemoveLogo}
                                        className="logo-cancel-button"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                        
                        {/* Logo Preview */}
                        {logoCroppedImage && !isLogoCropping && (
                            <div className="logo-preview-container">
                                <div className="logo-preview">
                                    <img
                                        src={logoCroppedImage}
                                        alt="Logo preview"
                                        className="logo-preview-image"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleRemoveLogo}
                                        className="logo-remove-button"
                                    >
                                        ×
                                    </button>
                                </div>
                            </div>
                        )}
                        
                        {/* TEMPORARILY DISABLED - Logo Name and URL Inputs */}
                        {false && (
                            <>
                                {/* Logo Name Input */}
                                {(logoCroppedImage || isLogoCropping) && (
                                    <div className="logo-name-group">
                                        <label htmlFor="logoName">Logo Name (optional)</label>
                                        <input
                                            type="text"
                                            id="logoName"
                                            value={logoName}
                                            onChange={(e) => setLogoName(e.target.value.slice(0, 20))}
                                            placeholder="Enter logo name"
                                            className="form-input logo-input"
                                            maxLength="20"
                                            autoComplete="off"
                                        />
                                        <div className="input-hint">{logoName.length}/20 characters</div>
                                    </div>
                                )}
                                
                                {/* Logo URL Input */}
                                {(logoCroppedImage || isLogoCropping) && (
                                    <div className="logo-url-group">
                                        <label htmlFor="logoUrl">Logo URL (optional)</label>
                                        <input
                                            type="url"
                                            id="logoUrl"
                                            value={logoUrl}
                                            onChange={(e) => setLogoUrl(e.target.value)}
                                            placeholder="https://example.com"
                                            className="form-input logo-input"
                                            autoComplete="off"
                                        />
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                    
                    {error && <div className="error-message">{error}</div>}
                    
                    <button 
                        type="submit" 
                        className="submit-button"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Creating...' : 'Create Lobby'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default CreateLobbyView;

