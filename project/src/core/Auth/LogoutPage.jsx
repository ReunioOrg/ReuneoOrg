import { useNavigate } from 'react-router-dom';
import { useEffect, useContext } from 'react';
import { AuthContext } from './AuthContext';

const LogoutPage = () => {
    const navigate = useNavigate();
    const { logout } = useContext(AuthContext);
    // remove access token from local storage
    localStorage.removeItem('access_token');

    // redirect to homescreen
    useEffect(() => {
        console.log("LogoutPage useEffect");
        setTimeout(() => {
            logout();
            navigate('/');
        }, 100);
    }, []);

    return <div>Logged out redirecting to homescreen</div>;
}

export default LogoutPage;
