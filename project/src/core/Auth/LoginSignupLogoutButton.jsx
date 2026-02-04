import { useNavigate } from 'react-router-dom';
import './LoginSignupLogoutButton.css';

const LoginSignupLogoutButton = ({ user, onProfileClick }) => {
    const navigate = useNavigate();

    return (
        <div>
            <div style={{ position: 'absolute', top: '45px', display: 'flex', alignItems: 'center', width: '94%', height: '10px', left: '3%' }}>
                {user==null ? 
                    <div style={{
                        position: 'fixed',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 10
                    }}>
                        <button
                            className="login-button"
                            onClick={() => navigate('/login')}
                            style={{ 
                                width: '160px',
                                height: '50px',
                                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.05))',
                                backdropFilter: 'blur(12px)',
                                WebkitBackdropFilter: 'blur(12px)',
                                color: 'rgba(255, 255, 255, 0.85)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                borderRadius: '14px',
                                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                                fontWeight: '900',
                                fontSize: '1rem',
                                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                                padding: '10px 20px',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <span style={{
                                textShadow: '0 0 1px rgba(58, 53, 53, 0.5)',
                                color: 'inherit'
                            }}>
                                Login
                            </span>
                        </button>
{/* Signup button hidden for new onboarding flows
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
                                color: 'inherit'
                            }}>
                                Sign up
                            </span>
                        </button>
                        */}
                    </div>
                    :
                    <div style={{position: 'absolute', width: '100%', display: 'flex', justifyContent: 'space-between'}}>
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
                                color: 'inherit'
                            }}>
                                Logout
                            </span>
                        </button>
                        <button
                            className="login-button"
                            onClick={onProfileClick}
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
                                color: 'inherit'
                            }}>
                                Profile
                            </span>
                        </button>
                    </div>
                }
            </div>
        </div>
    );
}

export default LoginSignupLogoutButton;

