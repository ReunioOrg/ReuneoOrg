import React, { useContext, useEffect } from 'react';
import { AuthContext } from '../Auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import './organizer-dashboard.css';

const OrganizerDashboard = () => {
    const { user, permissions, checkAuth } = useContext(AuthContext);
    const navigate = useNavigate();

    // Check permissions on mount
    useEffect(() => {
        if (permissions !== null) {
            if (permissions !== 'admin' && permissions !== 'organizer') {
                // User doesn't have organizer access - redirect to signup
                navigate('/organizer-signup');
            }
        }
    }, [permissions, navigate]);

    // Ensure auth is checked
    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    return (
        <div className="organizer-dashboard">
            <div className="dashboard-header">
                <h1>Organizer Dashboard</h1>
                <button 
                    onClick={() => navigate('/')}
                    className="dashboard-home-button"
                >
                    Home
                </button>
            </div>
            
            <div className="dashboard-content">
                <div className="dashboard-section">
                    <h2>Past Lobbies</h2>
                    <p>Lobby history and statistics will be displayed here.</p>
                </div>

                <div className="dashboard-section">
                    <h2>Pairing Interactions</h2>
                    <p>Detailed breakdowns of paired interactions per round will be shown here.</p>
                </div>
            </div>
        </div>
    );
};

export default OrganizerDashboard;

