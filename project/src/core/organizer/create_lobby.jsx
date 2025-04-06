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

    const navigate = useNavigate();

    useEffect(() => {
        // Auto-populate title and lobby code with username when component mounts
        if (user) {
            setTitle(user);
            setLobbyCode(user);
        }
    }, [user]);

    const handleSubmit = async (e) => {
        e.preventDefault();
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
                <div className="form-group">
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
                </div>
                
                <div className="form-group">
                    <label htmlFor="lobbyCode">Lobby Code</label>
                    <input
                        type="text"
                        id="lobbyCode"
                        value={lobbyCode}
                        onChange={(e) => setLobbyCode(e.target.value)}
                        placeholder="Enter lobby code"
                        required
                        className="form-input"
                    />
                </div>
                
                {error && <div className="error-message">{error}</div>}
                
                <div className="button-group">
                    <button 
                        type="button" 
                        className="back-button"
                        onClick={() => navigate(-1)}
                    >
                        Back
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

