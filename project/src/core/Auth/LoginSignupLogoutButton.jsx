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
                                borderRadius: '12px',
                                boxShadow: '0 0 10px rgba(74, 58, 58, 0.4)',
                                outline: '1px solid rgba(74, 58, 58, 0.4)'
                            }}
                        >
                            Login
                        </button>
                        <button
                            className="login-button bounce-animation"
                            onClick={() => navigate('/signup')}
                            style={{ 
                                borderRadius: '12px',
                                boxShadow: '0 0 10px rgba(74, 58, 58, 0.4)', 
                                outline: '1px solid rgba(74, 58, 58, 0.4)'
                            }}
                        >
                            Sign Up
                        </button>
                    </div>
                    :
                    <div>
                        <button 
                            className="login-button"
                            onClick={() => navigate('/logout')}
                            style={{ 
                                borderRadius: '12px',
                                boxShadow: '0 0 10px rgba(74, 58, 58, 0.4)',
                                outline: '1px solid rgba(74, 58, 58, 0.4)'
                            }}
                        >
                            Logout
                        </button>
                    </div>
                }
            </div>
        </div>
    );
}

export default LoginSignupLogoutButton;

