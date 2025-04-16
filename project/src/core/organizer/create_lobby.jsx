import React, { useEffect, useState, useRef } from 'react';
import { AuthContext } from '../Auth/AuthContext';
import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import './create_lobby.css';

const CreateLobbyView = () => {
    const { user, userProfile, checkAuth, permissions } = useContext(AuthContext);
    const [title, setTitle] = useState('');
    const [lobbyCode, setLobbyCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [showValidationPopup, setShowValidationPopup] = useState(false);
    const [validationMessage, setValidationMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);

    const navigate = useNavigate();
    const inputRef = useRef(null);

    useEffect(() => {
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

    // Function to validate lobby code (only letters and numbers allowed)
    const validateLobbyCode = (code) => {
        // Regular expression to match only letters and numbers
        const validCodeRegex = /^[a-zA-Z0-9]*$/;
        return validCodeRegex.test(code);
    };

    // Handle lobby code input change with validation
    const handleLobbyCodeChange = (e) => {
        const newValue = e.target.value;
        setIsTyping(true);
        
        // If the new value is valid or empty, update the state
        if (validateLobbyCode(newValue) || newValue === '') {
            setLobbyCode(newValue);
            setShowValidationPopup(false);
        } else {
            // If invalid, show the popup with an error message
            setValidationMessage("Only letters and numbers are allowed. No spaces, special characters, or symbols.");
            setShowValidationPopup(true);
            
            // Hide the popup after 3 seconds
            setTimeout(() => {
                setShowValidationPopup(false);
            }, 3000);
        }
        
        // Reset typing state after a delay
        setTimeout(() => {
            setIsTyping(false);
        }, 500);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validate lobby code before submission
        if (!validateLobbyCode(lobbyCode)) {
            setValidationMessage("Lobby code can only contain letters and numbers.");
            setShowValidationPopup(true);
            return;
        }
        
        setIsLoading(true);
        setError('');

        try {
            const response = await fetch(window.server_url + '/create_lobby', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    lobby_code: lobbyCode
                })
            });

            if (response.ok) {
                console.log("Lobby created successfully");
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
        <div className="create-lobby-container">
            <h1 className="create-lobby-title">Create a New Lobby</h1>
            
            <form onSubmit={handleSubmit} className="create-lobby-form">
                {/* <div className="form-group">
                    <label htmlFor="title">Lobby Title</label>
                    <input
                        type="text"
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Enter lobby title"
                        required
                        className="form-input"
                    />
                </div> */}
                
                <div className="form-group">
                    <label htmlFor="lobbyCode">Lobby Code</label>
                    <input
                        ref={inputRef}
                        type="text"
                        id="lobbyCode"
                        value={lobbyCode}
                        onChange={handleLobbyCodeChange}
                        placeholder="Enter lobby code (letters and numbers only)"
                        required
                        className={`form-input ${isTyping ? 'typing' : ''}`}
                        autoComplete="off"
                    />
                    <div className="input-hint">Only letters and numbers are allowed</div>
                </div>
                
                {error && <div className="error-message">{error}</div>}
                
                {/* Validation Popup */}
                {showValidationPopup && (
                    <div className="validation-popup">
                        <div className="validation-popup-content">
                            <p>{validationMessage}</p>
                            <button onClick={() => setShowValidationPopup(false)}>Close</button>
                        </div>
                    </div>
                )}
                
                <div className="button-group">
                    <button 
                        type="button" 
                        className="back-button"
                        onClick={() => navigate(-1)}
                    >
                        ← Back
                    </button>
                    
                    <button 
                        type="submit" 
                        className="submit-button"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Creating...' : 'Create Lobby'}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default CreateLobbyView;

