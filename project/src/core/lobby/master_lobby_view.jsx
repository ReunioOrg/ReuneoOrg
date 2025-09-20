import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../Auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import './master_lobby_view.css';

const POLL_INTERVAL = 5000;

const MasterLobbyView = () => {
    const { checkAuth, permissions, user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [lobbies, setLobbies] = useState([]); // [{id, code, player_count, lobby_state}]
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isInitialized, setIsInitialized] = useState(false);

    // 1. Only call checkAuth on mount
    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    // 2. Only set isInitialized when user is 'topaz' and has admin permissions
    useEffect(() => {
        if (user === 'topaz' && permissions === "admin") {
            setIsInitialized(true);
        } else if (permissions !== null && user !== null) {
            // User is authenticated but not authorized
            navigate('/');
        }
    }, [permissions, user, navigate]);

    // 3. Poll for lobbies
    useEffect(() => {
        if (!isInitialized) return;
        let isMounted = true;
        let pollTimeout;
        let isFirstLoad = true;

        const fetchLobbies = async () => {
            if (isFirstLoad) {
                setIsLoading(true);
            }
            setError(null);
            
            try {
                const token = localStorage.getItem('access_token');
                if (!token) return;
                
                const response = await fetch(window.server_url + '/admin_all_lobbies', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (!response.ok) throw new Error('Failed to fetch lobbies');
                const data = await response.json();
                
                if (data.status !== "success" || !Array.isArray(data.lobbies)) {
                    throw new Error('Invalid response format');
                }
                
                if (!isMounted) return;
                setLobbies(data.lobbies);
                console.log('Received lobbies data:', data.lobbies); // Debug log
                
            } catch (err) {
                if (isMounted) {
                    setError(err.message || 'Error fetching lobbies');
                    // Keep previous lobby data on error - don't clear lobbies
                }
            } finally {
                if (isMounted && isFirstLoad) {
                    setIsLoading(false);
                }
                isFirstLoad = false;
                pollTimeout = setTimeout(fetchLobbies, POLL_INTERVAL);
            }
        };

        fetchLobbies();
        return () => {
            isMounted = false;
            if (pollTimeout) clearTimeout(pollTimeout);
        };
    }, [isInitialized]);

    if (isLoading) {
        return (
            <div className="master-lobby-container">
                <div className="loading-state">
                    <div className="loading-spinner"></div>
                    <p>Loading lobbies...</p>
                </div>
            </div>
        );
    }

    if (error && lobbies.length === 0) {
        return (
            <div className="master-lobby-container">
                <div className="error-state">
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    if (lobbies.length === 0) {
        return (
            <div className="master-lobby-container">
                <div className="empty-state">
                    <p>No active lobbies found</p>
                </div>
            </div>
        );
    }

    return (
        <div className="master-lobby-container">
            <button className="back-button" onClick={() => navigate(-1)}>Back</button>
            {error && (
                <div className="error-banner" style={{ 
                    backgroundColor: '#f8d7da', 
                    color: '#721c24', 
                    padding: '0.75rem', 
                    marginBottom: '1rem', 
                    borderRadius: '0.25rem',
                    border: '1px solid #f5c6cb'
                }}>
                    {error} (showing last known data)
                </div>
            )}
            <div className="master-lobby-grid">
                {lobbies.map((lobby) => (
                    <div key={lobby.code} className="lobby-tile">
                        <div className="lobby-tile-content">
                            <h3 className="lobby-code">{lobby.code}</h3>
                            <div className="lobby-stats">
                                <span className="player-count">{lobby.player_count} players</span>
                                <span className="lobby-state">{lobby.lobby_state}</span>
                            </div>
                            <div style={{ fontSize: '0.7rem', color: '#666', marginTop: '0.5rem' }}>
                                Debug: player_count={lobby.player_count}, lobby_state={lobby.lobby_state}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MasterLobbyView;