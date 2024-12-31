import { useNavigate } from 'react-router-dom';

const LoginSignupLogoutButton = ({ user }) => {
    const navigate = useNavigate();

    return (
        <div>
            <div style={{ position: 'absolute', display: 'flex', alignItems: 'center', top: '1.5rem', width: '94%', height: '10px', left: '3%'}}>
                <div style={{ position: 'absolute', display: 'flex', gap: '1rem'}}>
                    {/* {user!=null ? <div>Logged in as: {user}</div> : <div>Not logged in</div>} */}
                    {user!=null ? <div><p>Logged in as: {user}</p></div> : null}

                </div>

                <div style={{position: 'absolute', right: '10px', display: 'flex', gap: '1rem' }}>
                    {user==null ? 
                    <div>
                        <button
                        className="login-button"
                        onClick={() => navigate('/login')}
                        style={{ borderColor: 'black', borderWidth: '1px', borderStyle: 'solid', borderRadius: '5px' }}
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
        </div>
    );
}

export default LoginSignupLogoutButton;

