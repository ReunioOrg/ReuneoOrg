import { useNavigate } from 'react-router-dom';

const LoginSignupLogoutButton = ({ user }) => {
    const navigate = useNavigate();

    return (
        <div>
            <div style={{ position: 'absolute', top: '1rem', left: '1rem', display: 'flex', gap: '1rem' }}>
                {user!=null ? <div>Logged in as: {user}</div> : <div>Not logged in</div>}
            </div>

            <div style={{ position: 'absolute', top: '3rem', left: '1rem', display: 'flex', gap: '1rem' }}>
                {user==null ? 
                <div>
                    <button
                    className="login-button"
                    onClick={() => navigate('/login')}
                    >
                    Login/Signup
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
    );
}

export default LoginSignupLogoutButton;

