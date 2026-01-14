import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from './AuthContext';
import toast, { Toaster } from 'react-hot-toast';
import './post-event-auth.css';

const PostEventAuth = () => {
    const navigate = useNavigate();
    const { checkAuth } = useContext(AuthContext);
    
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [contactUrl, setContactUrl] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    // Fetch user data on mount
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const token = localStorage.getItem('access_token');
                if (!token) {
                    navigate('/login');
                    return;
                }

                const response = await fetch(`${window.server_url}/load_user`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.status === 401) {
                    localStorage.removeItem('access_token');
                    navigate('/login');
                    return;
                }

                if (!response.ok) {
                    throw new Error('Failed to load user data');
                }

                const userData = await response.json();
                
                // Pre-populate form fields with existing values
                setName(userData.profile?.name || '');
                setEmail(userData.email || '');
                setContactUrl(userData.profile?.contact_url || '');

            } catch (err) {
                console.error('Error fetching user data:', err);
                setError('Failed to load user data. Please try again.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserData();
    }, [navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        try {
            const token = localStorage.getItem('access_token');
            if (!token) {
                navigate('/login');
                return;
            }

            // Build payload with all three fields (backend handles it)
            const payload = {
                name: name || '',
                email: email || '',
                contact_url: contactUrl || ''
            };

            const response = await fetch(`${window.server_url}/update_profile`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (response.status === 401) {
                localStorage.removeItem('access_token');
                navigate('/login');
                return;
            }

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update profile');
            }

            // Show success toast
            toast.success('Profile updated successfully!', {
                duration: 2000,
                style: {
                    background: '#4b73ef',
                    color: 'white',
                    borderRadius: '8px',
                    padding: '12px 20px',
                    fontSize: '0.9rem',
                    fontWeight: '500'
                }
            });

            // Call checkAuth to refresh context
            await checkAuth();

            // Redirect to paired-player-history after 1.5 seconds
            setTimeout(() => {
                navigate('/paired-player-history');
            }, 1500);

        } catch (err) {
            console.error('Error updating profile:', err);
            setError(err.message || 'An error occurred. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="post-event-auth-container">
                <div className="loading-message">Loading...</div>
            </div>
        );
    }

    return (
        <div className="post-event-auth-container">
            <Toaster position="top-center" />
            
            <button 
                onClick={() => navigate('/')} 
                className="homescreen-button"
            >
                Home
            </button>

            <h3 className="post-event-auth-header">
                Gain Access to Your Matches
            </h3>

            <div className="step-form-container">
                <form onSubmit={handleSubmit}>
                    {error && (
                        <div className="error-message" style={{ marginBottom: '20px' }}>
                            {error}
                        </div>
                    )}

                    <div style={{ marginTop: '0' }}>
                        <label className="step-label">
                            Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter your name"
                            className="step-input"
                        />
                    </div>

                    <div style={{ marginTop: '20px' }}>
                        <label className="step-label">
                            Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            className="step-input"
                        />
                    </div>

                    <div style={{ marginTop: '20px' }}>
                        <label className="step-label">
                            Contact URL
                        </label>
                        <input
                            type="text"
                            value={contactUrl}
                            onChange={(e) => setContactUrl(e.target.value)}
                            placeholder="Enter your contact URL (e.g., https://linkedin.com/...)"
                            className="step-input"
                        />
                    </div>

                    <button 
                        type="submit" 
                        className="primary-button"
                        disabled={isSubmitting}
                        style={{ marginTop: '30px' }}
                    >
                        {isSubmitting ? 'Submitting...' : 'Submit'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default PostEventAuth;
