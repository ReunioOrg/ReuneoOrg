import React, { useContext, useState } from 'react';
import { AuthContext } from './AuthContext';
import { useNavigate } from 'react-router-dom';

const LoginSignupPage = () => {
    const { login, signup, user, logout, checkAuth } = useContext(AuthContext);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [error, setError] = useState('');
    const [isLoginMode, setIsLoginMode] = useState(true);

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const endpoint = isLoginMode ? '/login' : '/signup';
            const response = await fetch(window.server_url+endpoint, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ username, password }),
                mode: 'cors'
            });

            if (response.ok) {
                const userData = await response.json();
                if (isLoginMode) {
                    login(userData);
                    checkAuth();
                } else {
                    // After successful signup, automatically log them in
                    login(userData);
                    checkAuth();
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
    };

    return (
        <div>
            <button onClick={() => {
                navigate('/');
            }}>Homescreen</button>
            <h1>Login</h1>
            <div className="login-container">
                {error && <div className="error-message">{error}</div>}
                
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

                    {/* <div className="form-group">
                        <input
                            type="text"
                            placeholder="If signing up, Display Name (Full name)" 
                            className="login-input"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                        />
                    </div> */}
                    <div>
                        <button type="submit" className="primary-button">
                            Login
                        </button>
                        {/* <button 
                            type="submit" 
                            className="primary-button"
                            onClick={() => setIsLoginMode(!isLoginMode)}
                        >
                            Signup
                        </button> */}
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

export default LoginSignupPage;









// const LoginSignupPage = () => {
//     const { login, user, logout } = useContext(AuthContext);
//     const [username, setUsername] = useState('');
//     const [password, setPassword] = useState('');
//     const [error, setError] = useState('');

//     const navigate = useNavigate();

  
//     const handleLogin = async (e) => {
//         e.preventDefault();
//         setError('');

//         try {
//             const response = await fetch(window.server_url+'/login', {
//                 method: 'POST',
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify({ "username": username, "password": password }),
//             });

//             if (response.ok) {
//                 const userData = await response.json();
//                 console.log("LOGGED IN, userData:", userData);
//                 login(userData);
//                 console.log(user);
//             } else {
//                 const errorData = await response.json();
//                 setError(errorData.message || 'Login failed');
//             }
//         } catch (error) {
//             setError('Network error occurred. Please try again.');
//             console.error('Error:', error);
//         }
//     };

//     const handleSignup = async (e) => {

//     const handleGoogleLogin = async () => {
//         try {
//             // Redirect to Google OAuth endpoint
//             window.location.href = '/api/auth/google';
//         } catch (error) {
//             setError('Google login failed. Please try again.');
//             console.error('Error:', error);
//         }
//     };