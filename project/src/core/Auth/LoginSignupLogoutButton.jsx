import { useNavigate } from 'react-router-dom';
import './LoginSignupLogoutButton.css';

const LoginSignupLogoutButton = ({ user }) => {
    const navigate = useNavigate();

    return (
        <div>
            <div style={{ position: 'absolute', display: 'flex', alignItems: 'center', top: '1.5rem', width: '94%', height: '10px', left: '3%'}}>
                <div style={{position: 'absolute', right: '10px', display: 'flex', gap: '1rem' }}>
                    {user==null ? 
                    <div style={{display: 'flex', gap: '1rem'}}>
                        <button
                        className="login-button"
                        onClick={() => navigate('/login')}
                        style={{ borderColor: 'white', borderWidth: '1px', borderStyle: 'solid', borderRadius: '5px' }}
                        >
                        Login
                        </button>
                        <button
                        className="login-button bounce-animation"
                        onClick={() => navigate('/signup')}
                        style={{ borderColor: 'white', borderWidth: '1px', borderStyle: 'solid', borderRadius: '5px' }}
                        >
                        Sign Up
                        </button>
                    </div>
                    :
                    <div>
                        <button 
                        className="login-button"
                        onClick={() => navigate('/logout')}
                        >
                        Logout
                        </button>
                    </div>
                    }
                </div>
            </div>
        </div>
    );
}

export default LoginSignupLogoutButton;

