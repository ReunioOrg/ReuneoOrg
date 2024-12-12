import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';


const LogoutPage = () => {
    const navigate = useNavigate();
    
    // remove access token from local storage
    localStorage.removeItem('access_token');

    // redirect to homescreen
    useEffect(() => {
        navigate('/');
    }, []);

    return <div>Logged out redirecting to homescreen</div>;
}

export default LogoutPage;
