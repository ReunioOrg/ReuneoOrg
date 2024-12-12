
import React, { useEffect, useState, useRef } from 'react';
import { AuthContext } from '../Auth/AuthContext';
import usePlaySound from '../playsound';
import { useContext } from 'react';





const LobbyScreen = () => {
    const { audioRef, error, playSound, loadSound, seekTo } = usePlaySound();

    const { user, userProfile, checkAuth } = useContext(AuthContext);

    const [opponentProfile, setOpponentProfile] = useState(null);
    const roundPosition = useRef(null);

    const playat=220;

    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                const token = localStorage.getItem('access_token');
                const response = await fetch(window.server_url+'/lobby', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    setOpponentProfile(data.opponent_profile);
                    roundPosition.current = data.round_time_left;
                    if (roundPosition.current!=null) {
                        seekTo(playat-roundPosition.current);
                    }
                }
            } catch (error) {
                console.error("Error fetching lobby data:", error);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div>
            <h1>LobbyScreen</h1>
            <h1>roundPosition: {roundPosition.current}</h1>

            {opponentProfile && (
                <div style={{ width: '80%', height: '80vh', margin: '0 auto' }}>
                    <h2>{opponentProfile.name}</h2>
                    <img 
                        src={`data:image/jpeg;base64,${opponentProfile.image_data}`} 
                        alt="Opponent Profile"
                        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                    />
                </div>
            )}

            <button onClick={loadSound}>Load Sound</button>
            <button onClick={playSound}>Play Sound</button>
            <button onClick={() => {seekTo(202)}}>Seek to x</button>
        </div>
    );
}

export default LobbyScreen;

