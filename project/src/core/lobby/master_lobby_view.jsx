import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../Auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import './master_lobby_view.css';
import { apiFetch } from '../utils/api';

const POLL_INTERVAL = 5000;

const MasterLobbyView = () => {
    const { checkAuth, permissions, isAuthLoading } = useContext(AuthContext);
    const navigate = useNavigate();
    const [lobbies, setLobbies] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    // Admin-only route. No username-based checks — rely on `permissions` (+ backend on `/admin_all_lobbies`).
    useEffect(() => {
        if (isAuthLoading) return;
        if (permissions === 'admin') {
            setIsInitialized(true);
            return;
        }
        navigate('/');
    }, [permissions, isAuthLoading, navigate]);

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
                const response = await apiFetch('/admin_all_lobbies');
                
                if (!response.ok) throw new Error('Failed to fetch lobbies');
                const data = await response.json();
                
                if (data.status !== "success" || !Array.isArray(data.lobbies)) {
                    throw new Error('Invalid response format');
                }
                
                if (!isMounted) return;
                setLobbies(data.lobbies);
                
            } catch (err) {
                if (isMounted) {
                    setError(err.message || 'Error fetching lobbies');
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
            <div className="master-lobby-nav">
                <button className="back-button" onClick={() => navigate(-1)}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M15 18l-6-6 6-6"/>
                    </svg>
                    Back
                </button>
            </div>
            <h1 className="master-lobby-title">All Lobbies</h1>
            <p className="master-lobby-subtitle">{lobbies.length} active {lobbies.length === 1 ? 'session' : 'sessions'}</p>
            {error && (
                <div className="error-banner">
                    {error} (showing last known data)
                </div>
            )}
            <div className="master-lobby-grid">
                {lobbies.map((lobby) => {
                    const mins = Math.floor((lobby.round_time_left || 0) / 60);
                    const secs = Math.floor((lobby.round_time_left || 0) % 60);
                    return (
                        <div key={lobby.code} className="lobby-tile" onClick={() => navigate(`/admin_lobby_view?code=${lobby.code}`)}>
                            <div className="lobby-tile-content">
                                <div className="lobby-tile-header">
                                    <h3 className="lobby-code">{lobby.code}</h3>
                                    <span className={`lobby-type-badge ${lobby.lobby_type}`}>
                                        {lobby.lobby_type}
                                    </span>
                                </div>
                                <div className="lobby-tile-organizer">{lobby.organizer_username}</div>
                                <div className="lobby-tile-stats">
                                    <div className="lobby-stat">
                                        <span className="lobby-stat-value">{lobby.player_count}</span>
                                        <span className="lobby-stat-label">players</span>
                                    </div>
                                    <div className="lobby-stat">
                                        <span className="lobby-stat-value">{lobby.unpaired_count}</span>
                                        <span className="lobby-stat-label">unpaired</span>
                                    </div>
                                    <div className="lobby-stat">
                                        <span className="lobby-stat-value">{mins}:{String(secs).padStart(2, '0')}</span>
                                        <span className="lobby-stat-label">time left</span>
                                    </div>
                                </div>
                                <div className="lobby-tile-footer">
                                    <span className={`lobby-state-badge ${lobby.lobby_state}`}>{lobby.lobby_state}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default MasterLobbyView;
