import { useNavigate } from 'react-router-dom';
import './LoginSignupLogoutButton.css';

const LoginSignupLogoutButton = ({ user }) => {
    const navigate = useNavigate();

    return (
        <div>
            <div style={{ position: 'absolute', display: 'flex', alignItems: 'center', width: '94%', height: '10px', left: '3%'}}>
                {user==null ? 
                    <div style={{position: 'absolute', width: '100%', display: 'flex', justifyContent: 'space-between'}}>
                        <button
                            className="login-button"
                            onClick={() => navigate('/login')}
                            style={{ 
                                width: '100px',
                                height: '35px',
                                borderRadius: '13px',
                                boxShadow: '0 0 4px rgba(74, 58, 58, 0.5)',
                                outline: '1px solid rgba(252, 240, 240, 0.6)',
                                fontWeight: '900',
                                fontSize: '1rem',
                                padding: '10px 10px',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center'
                            }}
                        >
                            <span style={{
                                textShadow: '0 0 1px rgba(58, 53, 53, 0.5)',
                                WebkitTextStroke: '0.6px rgba(58, 53, 53, 0.4)',
                                color: 'inherit'
                            }}>
                                Login
                            </span>
                        </button>
                        <button
                            className="login-button"
                            onClick={() => navigate('/signup')}
                            style={{ 
                                width: '100px',
                                height: '35px',
                                borderRadius: '13px',
                                boxShadow: '0 0 4px rgba(74, 58, 58, 0.5)', 
                                outline: '1px solid rgba(252, 240, 240, 0.6)',
                                fontWeight: '900',
                                fontSize: '1rem',
                                padding: '10px 10px',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center'
                            }}
                        >
                            <span style={{
                                textShadow: '0 0 1px rgba(58, 53, 53, 0.5)',
                                WebkitTextStroke: '0.6px rgba(58, 53, 53, 0.4)',
                                color: 'inherit'
                            }}>
                                Sign up
                            </span>
                        </button>
                    </div>
                    :
                    <div>
                        <button 
                            className="login-button"
                            onClick={() => navigate('/logout')}
                            style={{ 
                                width: '100px',
                                height: '35px',
                                borderRadius: '13px',
                                boxShadow: '0 0 4px rgba(74, 58, 58, 0.5)',
                                outline: '1px solid rgba(252, 240, 240, 0.6)',
                                fontWeight: '900',
                                fontSize: '1rem',
                                padding: '10px 10px',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center'
                            }}
                        >
                            <span style={{
                                textShadow: '0 0 1px rgba(58, 53, 53, 0.5)',
                                WebkitTextStroke: '0.6px rgba(58, 53, 53, 0.4)',
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

