const LoginSignupLogoutButton = ({ user }) => {

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
                    onClick={() => window.location.href = '/login'}
                    >
                    Login/Signup
                    </button>
                </div>
                :
                <div>
                    <button 
                    className="login-button"
                    onClick={() => window.location.href = '/logout'}
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

