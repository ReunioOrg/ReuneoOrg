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

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validate lobby code before submission
        if (!validateLobbyCode(lobbyCode)) {
            setError("Lobby code must be at least 2 characters long and contain only lowercase letters and numbers");
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
        <div className="create-lobby-background">
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
                    
                    {error && <div className="error-message">{error}</div>}
                    
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
        </div>
    );
}

export default CreateLobbyView;

