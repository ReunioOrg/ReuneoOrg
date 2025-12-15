import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './organizer_signup_success.css';

const OrganizerSignupSuccess = () => {
    const [active, setActive] = useState(false);
    const [error, setError] = useState('');
    const timerRef = useRef(null);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        // Extract session_id from query parameters
        const searchParams = new URLSearchParams(location.search);
        const sessionId = searchParams.get('session_id');

        // Verify payment with backend
        const verifyPayment = async () => {
            if (!sessionId) {
                setError('Missing session ID');
                // Still show animation and redirect
                setActive(true);
                timerRef.current = setTimeout(() => {
                    setActive(false);
                    navigate('/');
                }, 2000);
                return;
            }

            try {
                const token = localStorage.getItem('access_token');
                if (!token) {
                    setError('Authentication required');
                    setActive(true);
                    timerRef.current = setTimeout(() => {
                        setActive(false);
                        navigate('/');
                    }, 2000);
                    return;
                }

                const response = await fetch(`${window.server_url}/organizer-signup-success?session_id=${sessionId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                const data = await response.json();

                if (!response.ok || data.error) {
                    console.error('Payment verification failed:', data.error);
                    setError(data.error || 'Payment verification failed');
                    // Still show animation and redirect - graceful degradation
                }
            } catch (error) {
                console.error('Error verifying payment:', error);
                setError('Failed to verify payment');
                // Still show animation and redirect - graceful degradation
            }

            // Start animation
            setActive(true);

            // Redirect after 2 seconds
            timerRef.current = setTimeout(() => {
                setActive(false);
                navigate('/');
            }, 2000);
        };

        verifyPayment();

        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
                timerRef.current = null;
            }
        };
    }, [location.search, navigate]);

    if (!active) {
        return (
            <div className="signup-container">
                <div className="loading-message">Processing...</div>
            </div>
        );
    }

    return (
        <div className="success-overlay">
            <div className="success-text">Success! You're now an organizer!</div>
            {error && (
                <div className="success-error" style={{ marginTop: '20px' }}>
                    {error}
                </div>
            )}
        </div>
    );
};

export default OrganizerSignupSuccess;
