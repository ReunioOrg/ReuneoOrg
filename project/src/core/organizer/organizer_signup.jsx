import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../Auth/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import './organizer_signup.css';

const OrganizerSignup = () => {
    const { login, user, checkAuth, permissions } = useContext(AuthContext);
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();

    // Effect 1: Initial auth check on mount
    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (token && !user) {
            checkAuth();
        }
    }, []); // Empty deps - run once on mount

    // Effect 2: Check permissions and redirect if admin/organizer
    useEffect(() => {
        if (permissions !== null) {
            if (permissions === 'admin' || permissions === 'organizer') {
                navigate('/');
            }
        }
    }, [permissions, navigate]);

    // Effect 3: Check subscription status for existing users (after permissions check)
    useEffect(() => {
        const checkSubscriptionStatus = async () => {
            // Only check if:
            // 1. User exists (has account)
            // 2. Permissions check completed (not null)
            // 3. User is NOT admin/organizer (they would have been redirected already)
            if (user !== null && permissions !== null && permissions !== 'admin' && permissions !== 'organizer') {
                try {
                    const token = localStorage.getItem('access_token');
                    if (!token) return;

                    const response = await fetch(`${window.server_url}/check-subscription-status`, {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });

                    if (response.ok) {
                        const data = await response.json();
                        if (data.has_access === true) {
                            // User already has active subscription - redirect to account details
                            navigate('/organizer-account-details');
                        }
                    }
                } catch (error) {
                    console.error('Error checking subscription status:', error);
                    // Continue to show form if check fails
                }
            }
        };

        checkSubscriptionStatus();
    }, [user, permissions, navigate]);

    const validateUsername = (username) => {
        // Regular expression to match only lowercase letters and numbers
        const validUsernameRegex = /^[a-z0-9]+$/;
        return username.length >= 2 && validUsernameRegex.test(username);
    };

    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email) && email.trim() !== '';
    };

    const handleUsernameChange = (e) => {
        // Convert input to lowercase and remove any non-alphanumeric characters
        const sanitizedValue = e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '');
        setUsername(sanitizedValue);
        // Clear error when user starts typing
        if (error) setError('');
    };

    const handleEmailChange = (e) => {
        setEmail(e.target.value);
        // Clear error when user starts typing
        if (error) setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        // Validation
        const hasAccount = user !== null;
        
        if (!hasAccount) {
            // User doesn't have account - validate username and email
            if (!username || !validateUsername(username)) {
                setError('Username must be at least 2 characters and contain only lowercase letters and numbers');
                setIsLoading(false);
                return;
            }
        }

        // Always validate email
        if (!email || !validateEmail(email)) {
            setError('Please enter a valid email address');
            setIsLoading(false);
            return;
        }

        // Extract affiliate codes from URL query parameters
        const searchParams = new URLSearchParams(location.search);
        const rewardfulReferral = searchParams.get('rewardful') || searchParams.get('rewardful_referral') || '';
        const affiliateCode = searchParams.get('ref') || searchParams.get('affiliate_code') || '';

        // If user already has account, go straight to Stripe checkout
        if (hasAccount) {
            const token = localStorage.getItem('access_token');
            if (!token) {
                setError('Authentication required. Please log in again.');
                setIsLoading(false);
                return;
            }

            try {
                // Create Stripe checkout session
                const checkoutResponse = await fetch(`${window.server_url}/create-checkout-session`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        email: email,
                        rewardful_referral: rewardfulReferral,
                        affiliate_code: affiliateCode
                    }),
                });

                const checkoutData = await checkoutResponse.json();

                if (!checkoutResponse.ok || checkoutData.error) {
                    // Check if error is about existing subscription
                    if (checkoutData.error && checkoutData.error.includes("already have an active subscription")) {
                        navigate('/organizer-account-details');
                        return;
                    }
                    setError(checkoutData.error || 'Failed to create checkout session. Please try again.');
                    setIsLoading(false);
                    return;
                }

                // Redirect to Stripe checkout
                window.location.href = checkoutData.checkout_url;
                // isLoading stays true - page will unload
                return;
            } catch (error) {
                console.error('Error creating checkout session:', error);
                setError('An error occurred. Please try again.');
                setIsLoading(false);
                return;
            }
        }

        // User doesn't have account - create account
        try {
            // Step 1: Create account (username, password=username)
            const endpoint = '/signup';
            const response = await fetch(window.server_url + endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ username, password: username }),
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

            // Step 2: Login with returned userData
            login(userData);

            // Step 3: Call checkAuth
            await checkAuth();

            // Step 4: Get token
            const token = localStorage.getItem('access_token');
            if (!token) {
                throw new Error('Authentication failed');
            }

            // Step 5: Fetch and convert image to base64
            const imageResponse = await fetch('/assets/fakeprofile.png');
            if (!imageResponse.ok) {
                throw new Error('Failed to fetch profile image');
            }
            const blob = await imageResponse.blob();
            const imageBuffer = await blob.arrayBuffer();
            const base64Image = btoa(
                new Uint8Array(imageBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
            );

            // Step 6: Update profile (name=username, image=base64Image)
            const profileCreation = await fetch(`${window.server_url}/update_profile`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: username,
                    image_data: base64Image
                }),
            });

            if (!profileCreation.ok) {
                throw new Error('Failed to update profile');
            }

            // Step 7: Call checkAuth again
            await checkAuth();

            // Step 8: Create Stripe checkout session
            const checkoutResponse = await fetch(`${window.server_url}/create-checkout-session`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email,
                    rewardful_referral: rewardfulReferral,
                    affiliate_code: affiliateCode
                }),
            });

            const checkoutData = await checkoutResponse.json();

            if (!checkoutResponse.ok || checkoutData.error) {
                // Check if error is about existing subscription
                if (checkoutData.error && checkoutData.error.includes("already have an active subscription")) {
                    navigate('/organizer-account-details');
                    return;
                }
                throw new Error(checkoutData.error || 'Failed to create checkout session');
            }

            // Step 9: Redirect to Stripe checkout
            window.location.href = checkoutData.checkout_url;
            // isLoading stays true - page will unload

        } catch (error) {
            console.error('Error:', error);
            setError('An error occurred. Please try again.');
            setIsLoading(false);
        }
    };

    // Determine if username field should be shown
    const showUsernameField = user === null;

    // Determine if submit button should be disabled
    const isSubmitDisabled = isLoading || (permissions === 'admin' || permissions === 'organizer');

    return (
        <div className="signup-container">
            <button 
                onClick={() => navigate('/')} 
                className="homescreen-button"
            >
                Home
            </button>

            <img 
                src="/assets/reuneo_test_8.png"
                alt="Reunio Logo"
                className="logo-image"
            />

            <h3 className="signup-header">
                Become an Organizer
            </h3>

            <div className="step-form-container">
                <form onSubmit={handleSubmit}>
                    {/* Username field - hidden if user already has account */}
                    <div style={{ display: showUsernameField ? 'block' : 'none' }}>
                        <label className="step-label">
                            Username
                        </label>
                        <input
                            type="text"
                            value={username}
                            onChange={handleUsernameChange}
                            placeholder="Enter a username"
                            className="step-input"
                            autoFocus={showUsernameField}
                        />
                    </div>

                    {/* Email field - always shown */}
                    <div style={{ marginTop: showUsernameField ? '20px' : '0' }}>
                        <label className="step-label">
                            Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={handleEmailChange}
                            placeholder="Enter your email"
                            className="step-input"
                            autoFocus={!showUsernameField}
                        />
                    </div>

                    {/* Error message */}
                    {error && (
                        <div className="error-message" style={{ marginTop: '15px' }}>
                            {error}
                        </div>
                    )}

                    {/* Submit button */}
                    <button 
                        type="submit" 
                        className="primary-button"
                        disabled={isSubmitDisabled}
                        style={{ marginTop: '20px' }}
                    >
                        {isLoading ? 'Loading...' : 'Submit'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default OrganizerSignup;
