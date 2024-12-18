
import React, { useEffect, useState, useRef } from 'react';
import { AuthContext } from '../Auth/AuthContext';
import usePlaySound from '../playsound';
import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';




const LobbyScreen = () => {
    const { audioRef, error, playSound, loadSound, seekTo } = usePlaySound();

    const { user, userProfile, checkAuth } = useContext(AuthContext);

    const [opponentProfile, setOpponentProfile] = useState(null);
    const [prevOpponentProfile, setPrevOpponentProfile] = useState(null);
    const roundPosition = useRef(null);
    const [lobbyState, setLobbyState] = useState(null);
    const [roundTimeLeft, setRoundTimeLeft] = useState(null);

    // const playat=220;
    const playat=300;

    const navigate = useNavigate();


    async function leaveLobby(){
        const token = localStorage.getItem('access_token');
        const response = await fetch(window.server_url+'/disconnect_lobby', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (response.ok) {
            navigate('/');
        }
    }


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
                    if (opponentProfile!=null) {
                        setPrevOpponentProfile(opponentProfile);
                    }
                    setOpponentProfile(data.opponent_profile);
                    setLobbyState(data.lobby_state);
                    roundPosition.current = data.round_time_left;
                    setRoundTimeLeft(data.round_time_left);
                    console.log(data.lobby_state);
                    if ((roundPosition.current!=null) && (data.lobby_state=="active")) {
                        seekTo(playat-roundPosition.current);
                        console.log("seeking to", playat-roundPosition.current);
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
            <h1>Lobby State: {lobbyState}, Time Left: {roundTimeLeft},</h1>

            <div>
                {(lobbyState=="active")?(
                    (opponentProfile!=null)?(
                        <div style={{ width: '80%', height: '80vh', margin: '0 auto' }}>
                            <h2>{opponentProfile.name}</h2>
                            <img 
                                src={`data:image/jpeg;base64,${opponentProfile.image_data}`} 
                                alt="Opponent Profile"
                                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                            />
                        </div>
                    ):(
                        <h1>No pair</h1>
                    )
                ):(
                    <div>
                        {(prevOpponentProfile!=null)?(
                            <h2>Waiting for next round, previous round was with {prevOpponentProfile.name}</h2>
                        ):(
                            <h2>Waiting for next round</h2>
                        )}
                    </div>
                )}
            </div>
            <button onClick={leaveLobby}>Leave Lobby</button>
            <button onClick={loadSound}>Enable Sound</button>
            <button onClick={() => {seekTo(202)}}>Seek to x</button>
        </div>
    );
}

export default LobbyScreen;

