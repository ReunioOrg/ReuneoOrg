import { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../Auth/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import './organizer_signup.css';

const getRewardfulReferralFromBrowser = (locationSearch) => {
    try {
        const searchParams = new URLSearchParams(locationSearch || window.location.search);

        // Rewardful affiliate links typically land with ?via=...
        const viaParam = searchParams.get('via') || '';

        // Some older/alternate integrations may pass custom params
        const legacyParam =
            searchParams.get('rewardful') ||
            searchParams.get('rewardful_referral') ||
            '';

        // Rewardful JS exposes referral from cookie as Rewardful.referral
        // (We also guard for different global shapes.)
        const referralFromRewardfulJs =
            (typeof window !== 'undefined' && window.Rewardful && window.Rewardful.referral) ||
            '';

        const fromStorage =
            (typeof window !== 'undefined' && window.localStorage && window.localStorage.getItem('rewardful_referral')) ||
            '';

        const referral = referralFromRewardfulJs || legacyParam || viaParam || fromStorage || '';

        // Persist for SPA navigations where query string may not be present
        if (referral && typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem('rewardful_referral', referral);
        }

        return referral;
    } catch {
        return '';
    }
};

const OrganizerSignup = () => {
    const { login, user, checkAuth, permissions } = useContext(AuthContext);
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [cityState, setCityState] = useState('');
    const [eventType, setEventType] = useState('');
    const [avgAttendees, setAvgAttendees] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
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

    const validatePhone = (phoneValue) => {
        // Strip all non-digit characters
        const digitsOnly = phoneValue.replace(/\D/g, '');
        return digitsOnly.length === 10;
    };

    const validateCityState = (cityStateValue) => {
        return cityStateValue.trim().length >= 2;
    };

    const formatPhoneNumber = (value) => {
        // Strip all non-digit characters
        const digitsOnly = value.replace(/\D/g, '');
        
        // Format as (123) 456-7890
        if (digitsOnly.length === 0) return '';
        if (digitsOnly.length <= 3) return `(${digitsOnly}`;
        if (digitsOnly.length <= 6) return `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3)}`;
        return `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6, 10)}`;
    };

    const getPhoneDigits = (phoneValue) => {
        return phoneValue.replace(/\D/g, '');
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
        // Clear errors when user starts typing
        if (error) setError('');
        if (fieldErrors.email) {
            setFieldErrors(prev => ({ ...prev, email: '' }));
        }
    };

    const handlePhoneChange = (e) => {
        const value = e.target.value;
        setPhone(value);
        // Clear errors when user starts typing
        if (error) setError('');
        if (fieldErrors.phone) {
            setFieldErrors(prev => ({ ...prev, phone: '' }));
        }
    };

    const handlePhoneBlur = () => {
        const formatted = formatPhoneNumber(phone);
        setPhone(formatted);
        // Validate on blur
        if (formatted && !validatePhone(formatted)) {
            setFieldErrors(prev => ({ ...prev, phone: 'Invalid phone number' }));
        } else {
            setFieldErrors(prev => ({ ...prev, phone: '' }));
        }
    };

    const handleCityStateChange = (e) => {
        const value = e.target.value;
        setCityState(value);
        // Clear errors when user starts typing
        if (error) setError('');
        if (fieldErrors.cityState) {
            setFieldErrors(prev => ({ ...prev, cityState: '' }));
        }
    };

    const handleCityStateBlur = () => {
        // Validate on blur
        if (cityState && !validateCityState(cityState)) {
            setFieldErrors(prev => ({ ...prev, cityState: 'City/State must be at least 2 characters' }));
        } else {
            setFieldErrors(prev => ({ ...prev, cityState: '' }));
        }
    };

    const handleEventTypeChange = (e) => {
        setEventType(e.target.value);
        // Clear errors
        if (fieldErrors.eventType) {
            setFieldErrors(prev => ({ ...prev, eventType: '' }));
        }
    };

    const handleAvgAttendeesChange = (e) => {
        setAvgAttendees(e.target.value);
        // Clear errors
        if (fieldErrors.avgAttendees) {
            setFieldErrors(prev => ({ ...prev, avgAttendees: '' }));
        }
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
            setFieldErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }));
            setError('Please enter a valid email address');
            setIsLoading(false);
            return;
        }

        // Validate phone number (required)
        const phoneDigits = getPhoneDigits(phone);
        if (!phone || !validatePhone(phone)) {
            setFieldErrors(prev => ({ ...prev, phone: 'Please enter a valid phone number' }));
            setError('Please enter a valid phone number');
            setIsLoading(false);
            return;
        }

        // Validate city/state (required)
        if (!cityState || !validateCityState(cityState)) {
            setFieldErrors(prev => ({ ...prev, cityState: 'City/State is required (minimum 2 characters)' }));
            setError('City/State is required (minimum 2 characters)');
            setIsLoading(false);
            return;
        }

        // Extract affiliate codes from URL query parameters
        const searchParams = new URLSearchParams(location.search);
        const rewardfulReferral = getRewardfulReferralFromBrowser(location.search);
        const affiliateCode = searchParams.get('ref') || searchParams.get('affiliate_code') || '';

        // If user already has account, update profile first, then go to Stripe checkout
        if (hasAccount) {
            const token = localStorage.getItem('access_token');
            if (!token) {
                setError('Authentication required. Please log in again.');
                setIsLoading(false);
                return;
            }

            try {
                // Update profile with new fields before Stripe checkout
                const profileUpdateResponse = await fetch(`${window.server_url}/update_profile`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        phone_number: phoneDigits,
                        city_state: cityState,
                        event_type: eventType || '',
                        avg_attendees: avgAttendees || ''
                    }),
                });

                if (!profileUpdateResponse.ok) {
                    throw new Error('Failed to update profile');
                }

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

            // Step 6: Update profile (name=username, image=base64Image, and new fields)
            const profileCreation = await fetch(`${window.server_url}/update_profile`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: username,
                    image_data: base64Image,
                    phone_number: phoneDigits,
                    city_state: cityState,
                    event_type: eventType || '',
                    avg_attendees: avgAttendees || ''
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
                        {/* Info message - shows when user starts typing */}
                        {username.length > 0 && (
                            <div className="username-info-message">
                                <svg 
                                    className="info-icon" 
                                    width="16" 
                                    height="16" 
                                    viewBox="0 0 16 16" 
                                    fill="none"
                                >
                                    <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
                                    <path d="M8 5V7M8 11V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                                    <circle cx="8" cy="5" r="0.5" fill="currentColor"/>
                                </svg>
                                <span>This will be your temporary password</span>
                            </div>
                        )}
                    </div>

                    {/* Email field - always shown */}
                    <div style={{ marginTop: showUsernameField ? '20px' : '0' }}>
                        <label className="step-label">
                            Email
                            {fieldErrors.email && (
                                <svg 
                                    className="error-icon" 
                                    width="16" 
                                    height="16" 
                                    viewBox="0 0 16 16" 
                                    fill="none"
                                    style={{ marginLeft: '8px', display: 'inline-block', verticalAlign: 'middle' }}
                                >
                                    <circle cx="8" cy="8" r="7" stroke="#dc3545" strokeWidth="1.5" fill="#ffebee"/>
                                    <path d="M8 4V8M8 12V10" stroke="#dc3545" strokeWidth="1.5" strokeLinecap="round"/>
                                    <circle cx="8" cy="4" r="0.5" fill="#dc3545"/>
                                </svg>
                            )}
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={handleEmailChange}
                            placeholder="Enter your email"
                            className={`step-input ${fieldErrors.email ? 'input-error' : ''}`}
                            autoFocus={!showUsernameField}
                        />
                    </div>

                    {/* Phone number field - always shown */}
                    <div style={{ marginTop: '20px' }}>
                        <label className="step-label">
                            Phone Number
                            {fieldErrors.phone && (
                                <svg 
                                    className="error-icon" 
                                    width="16" 
                                    height="16" 
                                    viewBox="0 0 16 16" 
                                    fill="none"
                                    style={{ marginLeft: '8px', display: 'inline-block', verticalAlign: 'middle' }}
                                >
                                    <circle cx="8" cy="8" r="7" stroke="#dc3545" strokeWidth="1.5" fill="#ffebee"/>
                                    <path d="M8 4V8M8 12V10" stroke="#dc3545" strokeWidth="1.5" strokeLinecap="round"/>
                                    <circle cx="8" cy="4" r="0.5" fill="#dc3545"/>
                                </svg>
                            )}
                        </label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={handlePhoneChange}
                            onBlur={handlePhoneBlur}
                            placeholder="(123) 456-7890"
                            className={`step-input ${fieldErrors.phone ? 'input-error' : ''}`}
                        />
                    </div>

                    {/* City/State field - always shown */}
                    <div style={{ marginTop: '20px' }}>
                        <label className="step-label">
                            City / State
                            {fieldErrors.cityState && (
                                <svg 
                                    className="error-icon" 
                                    width="16" 
                                    height="16" 
                                    viewBox="0 0 16 16" 
                                    fill="none"
                                    style={{ marginLeft: '8px', display: 'inline-block', verticalAlign: 'middle' }}
                                >
                                    <circle cx="8" cy="8" r="7" stroke="#dc3545" strokeWidth="1.5" fill="#ffebee"/>
                                    <path d="M8 4V8M8 12V10" stroke="#dc3545" strokeWidth="1.5" strokeLinecap="round"/>
                                    <circle cx="8" cy="4" r="0.5" fill="#dc3545"/>
                                </svg>
                            )}
                        </label>
                        <input
                            type="text"
                            value={cityState}
                            onChange={handleCityStateChange}
                            onBlur={handleCityStateBlur}
                            placeholder="City / State"
                            className={`step-input ${fieldErrors.cityState ? 'input-error' : ''}`}
                        />
                    </div>

                    {/* Event Type dropdown - always shown, optional */}
                    <div style={{ marginTop: '20px' }}>
                        <label className="step-label">
                            What events do you host?
                        </label>
                        <select
                            value={eventType}
                            onChange={handleEventTypeChange}
                            className="step-select"
                        >
                            <option value="">Select an option...</option>
                            <option value="Hospitality-Restaurants">Hospitality-Restaurants</option>
                            <option value="Social">Social</option>
                            <option value="Residential">Residential</option>
                            <option value="Business Networking">Business Networking</option>
                            <option value="Event Specialist">Event Specialist</option>
                            <option value="Education">Education</option>
                            <option value="HR-Team Building">HR-Team Building</option>
                            <option value="Corporate">Corporate</option>
                            <option value="Co-working">Co-working</option>
                            <option value="Dating">Dating</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    {/* Avg Attendees dropdown - always shown, optional */}
                    <div style={{ marginTop: '20px' }}>
                        <label className="step-label">
                            Avg # of attendees
                        </label>
                        <select
                            value={avgAttendees}
                            onChange={handleAvgAttendeesChange}
                            className="step-select"
                        >
                            <option value="">Select an option...</option>
                            <option value="5-15">5-15</option>
                            <option value="15-30">15-30</option>
                            <option value="30-50">30-50</option>
                            <option value="50-75">50-75</option>
                            <option value="75-100">75-100</option>
                            <option value="100-150">100-150</option>
                            <option value="150-200">150-200</option>
                            <option value="200+">200+</option>
                        </select>
                    </div>

                    {/* Error message - combined errors above submit button */}
                    {error && (
                        <div className="error-message" style={{ marginTop: '15px', marginBottom: '10px' }}>
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
