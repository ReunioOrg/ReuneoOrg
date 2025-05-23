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
    const [customTags, setCustomTags] = useState([]);
    const [tagInput, setTagInput] = useState('');
    const [minutes, setMinutes] = useState('5');
    const [seconds, setSeconds] = useState('0');

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

        try {
            const response = await fetch(window.server_url + '/create_lobby', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    lobby_code: lobbyCode,
                    custom_tags: customTags,
                    lobby_duration: lobbyDuration
                })
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
                                        if (value === '' || (parseInt(value) > 0 && parseInt(value) <= 5)) {
                                            setMinutes(value);
                                            // Reset seconds to 0 if minutes is 5
                                            if (parseInt(value) === 5) {
                                                setSeconds('0');
                                            }
                                        }
                                    }}
                                    min="1"
                                    max="5"
                                    placeholder="1-5"
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
                                    disabled={parseInt(minutes) === 5}
                                />
                                <label htmlFor="seconds" className="duration-label">Seconds</label>
                            </div>
                        </div>
                        <div className="input-hint">Maximum total duration is 5 minutes</div>
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="tagInput">Matchmaking Tags</label>
                        <div className="tag-input-container">
                            <input
                                type="text"
                                id="tagInput"
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={handleTagKeyDown}
                                placeholder="Add tags (press + to add)"
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
                        <div className="input-hint">If you want to match people based on role/interests</div>
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

