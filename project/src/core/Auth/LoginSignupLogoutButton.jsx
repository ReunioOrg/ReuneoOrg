import { useNavigate } from 'react-router-dom';
import './LoginSignupLogoutButton.css';

const LoginSignupLogoutButton = ({ user }) => {
    const navigate = useNavigate();

    return (
        <div>
            <div style={{ position: 'absolute', display: 'flex', alignItems: 'center', top: '1.5rem', width: '94%', height: '10px', left: '3%'}}>
                {user==null ? 
                    <div style={{position: 'absolute', width: '100%', display: 'flex', justifyContent: 'space-between'}}>
                        <button
                            className="login-button"
                            onClick={() => navigate('/login')}
                            style={{ 
                                borderRadius: '14px',
                                boxShadow: '0 0 10px rgba(74, 58, 58, 0.5)',
                                outline: '1px solid rgba(58, 53, 53, 0.9)',
                                fontWeight: '700',
                                fontSize: '1.2rem'
                            }}
                        >
                            <span style={{
                                textShadow: '0 0 1px rgba(58, 53, 53, 0.5)',
                                WebkitTextStroke: '0.6px rgba(58, 53, 53, 0.7)',
                                color: 'inherit'
                            }}>
                                Login
                            </span>
                        </button>
                        <button
                            className="login-button"
                            onClick={() => navigate('/signup')}
                            style={{ 
                                borderRadius: '14px',
                                boxShadow: '0 0 10px rgba(74, 58, 58, 0.5)', 
                                outline: '1px solid rgba(58, 53, 53, 0.9)',
                                fontWeight: '700',
                                fontSize: '1.2rem',
                                alignSelf: 'center' // Ensures vertical alignment with the login button
                            }}
                        >
                            <span style={{
                                textShadow: '0 0 1px rgba(58, 53, 53, 0.7)',
                                WebkitTextStroke: '0.6px rgba(58, 53, 53, 0.7)',
                                color: 'inherit'
                            }}>
                                Signup
                            </span>
                        </button>
                    </div>
                    :
                    <div>
                        <button 
                            className="login-button"
                            onClick={() => navigate('/logout')}
                            style={{ 
                                borderRadius: '14px',
                                boxShadow: '0 0 10px rgba(74, 58, 58, 0.5)',
                                outline: '1px solid rgba(58, 53, 53, 0.9)',
                                fontWeight: '700',
                                fontSize: '1.2rem'
                            }}
                        >
                            <span style={{
                                textShadow: '0 0 1px rgba(58, 53, 53, 0.7)',
                                WebkitTextStroke: '0.6px rgba(58, 53, 53, 0.7)',
                                color: 'inherit'
                            }}>
                                Logout
                            </span>
                        </button>
                    </div>
                }
            </div>
        </div>
    );
}

export default LoginSignupLogoutButton;

