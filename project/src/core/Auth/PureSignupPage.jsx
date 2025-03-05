import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from './AuthContext';
import { useNavigate } from 'react-router-dom';
import getCroppedImg from '../cropImage'; // Utility function for cropping
import ReactCropper from 'react-easy-crop';
import './PureSignupPage.css';

const PureSignupPage = () => {
    const { login, signup, user, logout, checkAuth } = useContext(AuthContext);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [profileImage, setProfileImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [error, setError] = useState('');
    const [isLoginMode, setIsLoginMode] = useState(true);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [cropArea, setCropArea] = useState(null);
    const [isCropping, setIsCropping] = useState(false);

    const [isLoading, setIsLoading] = useState(false);
    const [isFormComplete, setIsFormComplete] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        setIsFormComplete(username && password && displayName && profileImage);
    }, [username, password, displayName, profileImage]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    // Calculate new dimensions maintaining aspect ratio
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

                    // Create canvas and resize image
                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    // Convert to base64 and set states
                    const resizedImage = canvas.toDataURL('image/jpeg', 0.75);
                    setProfileImage(file);
                    setImagePreview(resizedImage);
                    setIsCropping(true);
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleCropComplete = (croppedArea, croppedAreaPixels) => {
        setCropArea(croppedAreaPixels);
    };

    const handleSubmit = async (e) => {
        setIsLoading(true);
        e.preventDefault();
        setError('');
    
        if (!username || !password || !displayName) {
            setError('Username, password, and display name are required');
            setIsLoading(false);
            return;
        }
    
        try {
            // 1️⃣ First, create the user account
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
    
            // 2️⃣ Login after successful signup
            login(userData);
            await checkAuth();
    
            // 3️⃣ Get auth token
            const token = localStorage.getItem('access_token');
            if (!token) {
                throw new Error('Authentication failed');
            }
    
            // 4️⃣ Convert the image to base64 before sending
            let base64Image = null;
            if (profileImage) {
                base64Image=imagePreview;
                base64Image = base64Image.split(',')[1];
                // if (isCropping && cropArea) {
                //     // Convert cropped image to base64
                //     //base64Image = await getCroppedImg(imagePreview, cropArea);
                //     //base64Image = base64Image.split(',')[1]; // Remove the "data:image/jpeg;base64," prefix
                //     base64Image=imagePreview;
                // } else {
                //     // Convert the original image to base64
                //     const imageBuffer = await profileImage.arrayBuffer();
                //     base64Image = btoa(
                //         new Uint8Array(imageBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
                //     );
                //}
            } else {
                // 5️⃣ If no image is uploaded, use the default "fakeprofile.png"
                const response = await fetch('/assets/fakeprofile.png');
                const blob = await response.blob();
                const imageBuffer = await blob.arrayBuffer();
                base64Image = btoa(
                    new Uint8Array(imageBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
                );
            }
    
            // 6️⃣ Send the profile image and display name to backend
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
    
            await checkAuth(); // Update UI with new profile
            navigate('/');
    
        } catch (error) {
            console.error('Error:', error);
            setError('An error occurred. Please try again.');
        }
    
        setIsLoading(false);
    };

    return (
        <div className="signup-container" style={{
            background: 'linear-gradient(135deg, rgba(20,77,255,0.1) 0%, rgba(20,77,255,0.05) 100%)',
            minHeight: '100vh',
            padding: '0.5rem',
            width: '100%',
            maxWidth: '100%',
            margin: '0 auto',
            boxSizing: 'border-box',
            overflowX: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
        }}>
            <button 
                onClick={() => navigate('/')} 
                className="homescreen-button"
                style={{
                    background: 'linear-gradient(45deg, #144dff, #2979ff)',
                    padding: '0.6rem 1.2rem',
                    borderRadius: '25px',
                    border: 'none',
                    color: 'white',
                    fontSize: '0.9rem',
                    boxShadow: '0 4px 15px rgba(20,77,255,0.3)',
                    transition: 'all 0.3s ease',
                    position: 'absolute',
                    left: '20px',
                    top: '20px'
                }}
            >
                Home
            </button>

            <img 
                src="/assets/Reunio-color-4K.png"
                alt="Reunio Logo"
                style={{
                    width: 'auto',
                    height: '40px',
                    marginTop: '2rem',
                    marginBottom: '1rem',
                    objectFit: 'contain'
                }}
            />

            <h1 className="signup-header" style={{
                fontSize: 'clamp(1.8rem, 6vw, 2.5rem)',
                marginTop: '0.5rem',
                marginBottom: '1.5rem'
            }}>Signup</h1>
            <div className="login-container" style={{
                background: 'rgba(255,255,255,0.95)',
                borderRadius: '20px',
                padding: '1rem',
                boxShadow: '0 10px 30px rgba(20,77,255,0.15)',
                width: '90%',
                maxWidth: '400px',
                margin: '0 auto',
                boxSizing: 'border-box'
            }}>
                {error && (
                    <div className="error-message" style={{
                        backgroundColor: '#ffebee',
                        color: '#d32f2f',
                        padding: '10px',
                        borderRadius: '10px',
                        marginBottom: '15px',
                        textAlign: 'center',
                        border: '1px solid #ef9a9a',
                        animation: 'shake 0.5s ease-in-out',
                        fontSize: '0.9rem'
                    }}>
                        {error}
                    </div>
                )}
                
                <form className="login-signup-form" onSubmit={handleSubmit} style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                    width: '100%'
                }}>
                    <div className="form-group" style={{width: '100%'}}>
                        <input
                            type="text"
                            placeholder="Email"
                            className="form-label"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '12px',
                                border: '2px solid #e0e0e0',
                                fontSize: '0.9rem',
                                transition: 'all 0.3s ease',
                                backgroundColor: 'rgba(255,255,255,0.9)',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>
                    <div className="form-group" style={{width: '100%'}}>
                        <input
                            type="password"
                            placeholder="Password" 
                            className="form-label"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '12px',
                                border: '2px solid #e0e0e0',
                                fontSize: '0.9rem',
                                transition: 'all 0.3s ease',
                                backgroundColor: 'rgba(255,255,255,0.9)',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>

                    <div className="form-group" style={{width: '100%'}}>
                        <input
                            type="text"
                            placeholder="Preferred Name" 
                            className="form-label"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            required
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '12px',
                                border: '2px solid #e0e0e0',
                                fontSize: '0.9rem',
                                transition: 'all 0.3s ease',
                                backgroundColor: 'rgba(255,255,255,0.9)',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>
                    <div className="form-group" style={{width: '100%'}}>
                        <label 
                            htmlFor="profile-image" 
                            style={{
                                display: 'block',
                                marginBottom: '8px',
                                fontSize: '0.9rem',
                                fontWeight: '600',
                                color: '#144dff'
                            }}
                        >
                            Upload Image
                        </label>
                        <input
                            id="profile-image"
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="form-label"
                            required
                            style={{
                                width: '100%',
                                padding: '10px',
                                borderRadius: '12px',
                                border: '2px solid #e0e0e0',
                                backgroundColor: '#f8f9fa',
                                fontSize: '0.9rem',
                                boxSizing: 'border-box'
                            }}
                        />
                        <div style={{ 
                            marginTop: '15px',
                            marginBottom: '15px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '10px',
                            width: '100%'
                        }}>
                            {imagePreview && !isCropping && (
                                <>
                                    <img 
                                        src={imagePreview} 
                                        alt="Profile preview" 
                                        style={{ 
                                            width: '250px', 
                                            height: '250px', 
                                            objectFit: 'cover',
                                            borderRadius: '20%',
                                            boxShadow: '0 2px 8px rgb(0, 0, 0)',
                                            border: '8px solid #144dff'
                                        }} 
                                    />
                                    {!cropArea && (
                                        <button
                                            type="button"
                                            onClick={() => setIsCropping(true)}
                                            style={{
                                                background: 'linear-gradient(45deg, #144dff, #2979ff)',
                                                color: 'white',
                                                padding: '10px 20px',
                                                borderRadius: '25px',
                                                border: 'none',
                                                fontSize: '0.9rem',
                                                fontWeight: '600',
                                                cursor: 'pointer',
                                                transition: 'all 0.3s ease',
                                                boxShadow: '0 4px 15px rgba(20,77,255,0.2)'
                                            }}
                                        >
                                            Crop Image
                                        </button>
                                    )}
                                </>
                            )}
                            {isCropping && imagePreview && (
                                <div style={{
                                    width: '100%',
                                    maxWidth: '300px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '10px',
                                    padding: '10px',
                                    borderRadius: '15px',
                                    backgroundColor: 'white',
                                    boxShadow: '0 5px 20px rgba(20,77,255,0.1)'
                                }}>
                                    <div style={{
                                        position: 'relative',
                                        width: '100%',
                                        height: '250px',
                                        backgroundColor: '#fff',
                                        borderRadius: '12px',
                                        overflow: 'hidden'
                                    }}>
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
                                    <div style={{
                                        display: 'flex',
                                        gap: '8px',
                                        justifyContent: 'center'
                                    }}>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsCropping(false);
                                                setCropArea(null);
                                            }}
                                            style={{
                                                padding: '10px 20px',
                                                borderRadius: '25px',
                                                border: '2px solid #144dff',
                                                background: 'white',
                                                color: '#144dff',
                                                fontWeight: '600',
                                                cursor: 'pointer',
                                                transition: 'all 0.3s ease',
                                                fontSize: '0.9rem'
                                            }}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="button"
                                            onClick={async () => {
                                                const croppedImage = await getCroppedImg(imagePreview, cropArea);
                                                setImagePreview(croppedImage);
                                                setIsCropping(false);
                                            }}
                                            style={{
                                                padding: '10px 20px',
                                                borderRadius: '25px',
                                                border: 'none',
                                                background: 'linear-gradient(45deg, #144dff, #2979ff)',
                                                color: 'white',
                                                fontWeight: '600',
                                                cursor: 'pointer',
                                                transition: 'all 0.3s ease',
                                                boxShadow: '0 4px 15px rgba(20,77,255,0.2)',
                                                fontSize: '0.9rem'
                                            }}
                                        >
                                            Apply Crop
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    <div style={{width: '100%'}}>
                        <button 
                            type="submit" 
                            className={`primary-button ${isFormComplete ? 'bounce-animation' : ''}`}
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
                                boxShadow: '0 4px 15px rgba(20,77,255,0.2)'
                            }}
                        >
                            {isLoading ? 'Loading...' : 'Signup'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PureSignupPage;


