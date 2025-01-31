import React, { useContext, useState } from 'react';
import { AuthContext } from './AuthContext';
import { useNavigate } from 'react-router-dom';

const PureSignupPage = () => {
    const { login, signup, user, logout, checkAuth } = useContext(AuthContext);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [error, setError] = useState('');
    const [isLoginMode, setIsLoginMode] = useState(true);

    const [isLoading, setIsLoading] = useState(false);

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        setIsLoading(true);
        e.preventDefault();
        setError('');

        try {
            const endpoint = '/signup';
            const response = await fetch(window.server_url+endpoint, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ username, password }),
                mode: 'cors'
            });

            const userData = await response.json();
            console.log(userData);
            if (userData.error === "Username already taken") {
                console.log("Username is taken");
                setError("Username is taken");
                setIsLoading(false);
                return;
            }

            if (response.ok) {
                if (isLoginMode) {
                    login(userData);
                    checkAuth();
                } else {
                    // After successful signup, automatically log them in
                    login(userData);
                    checkAuth();
                }

                const token = localStorage.getItem('access_token');
  
                try {
                    const profile_creation = await fetch(`${window.server_url}/update_profile`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({name: displayName, image_data: ""}),
                    });
                
                    if (!profile_creation.ok) {
                        throw new Error('Failed to update profile');
                    }
                
                    const result = await profile_creation.json();
                    await checkAuth(); // Update UI with new profile
                    console.log('Profile updated successfully:', result);
                } catch (error) {
                    console.error('Error updating profile:', error);
                }

                navigate('/');
            } else {
                const errorData = await response.json();
                setError(errorData.message || `${isLoginMode ? 'Login' : 'Signup'} failed`);
            }
        } catch (error) {
            setError('Network error occurred. Please try again.');
            console.error('Error:', error);
        }
        setIsLoading(false);
    };

    return (
        <div>
            <button onClick={() => {
                navigate('/');
            }}>Homescreen</button>
            <h1>Signup</h1>
            <div className="login-container">
                {error && (
                    <div className="error-message" style={{
                        backgroundColor: '#ffebee',
                        color: '#d32f2f',
                        padding: '10px',
                        borderRadius: '4px',
                        marginBottom: '15px',
                        textAlign: 'center',
                        border: '1px solid #ef9a9a'
                    }}>
                        {error}
                    </div>
                )}
                
                <form className="login-signup-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <input
                            type="text"
                            placeholder="Username"
                            className="login-input"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <input
                            type="password"
                            placeholder="Password" 
                            className="login-input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <input
                            type="text"
                            placeholder="Display Name (Full name)" 
                            className="login-input"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                        />
                    </div>
                    <div>
                        <button 
                            type="submit" 
                            className="primary-button"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Loading...' : 'Signup'}
                        </button>
                    </div>
                </form>
                
                {/* <div className="divider">
                    <span>OR</span>
                </div>

                <button 
                    className="google-login-button"
                    // onClick={handleGoogleLogin}
                >
                    <img 
                        src="/google-icon.png" 
                        alt="Google"
                        className="google-icon"
                    />
                    Login with Google
                </button> */}
            </div>
        </div>
    );
};

export default PureSignupPage;


