import React, { useEffect, useState, useRef } from 'react';
import { AuthContext } from '../Auth/AuthContext';
import usePlaySound from '../playsound';
import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import PlayerCard from './playerCard';
import './lobby.css';
import { CountdownCircleTimer } from "react-countdown-circle-timer";

const AVAILABLE_TAGS = [
    "Founder",
    "Business",
    "Engineer",
    "Artist or Designer",
    "Sales or Marketing",
    "Finance",
    "Law"
];



const LobbyScreen = () => {
    const { audioRef, error, playSound, loadSound, seekTo, cancelSound, checkSound, soundEnabled, setSoundEnabled } = usePlaySound();

    const { user, userProfile, checkAuth } = useContext(AuthContext);

    const [opponentProfile, setOpponentProfile] = useState(null);
    const [prevOpponentProfile, setPrevOpponentProfile] = useState(null);

    const [opponentName, setOpponentName] = useState(null);
    const [prevOpponentName, setPrevOpponentName] = useState(null);

    const [tableNumber, setTableNumber] = useState(null);

    const isFetchingProfile=useRef(false);

    const roundPosition = useRef(null);
    const [lobbyState, setLobbyState] = useState(null);
    const [roundTimeLeft, setRoundTimeLeft] = useState(null);
    const [showSoundPrompt, setShowSoundPrompt] = useState(true);

    // const playat=220;
    const playat=300;
    const isFetchingCounter=useRef(0);

    const navigate = useNavigate();

    const [selfTags, setSelfTags] = useState([]);
    const [desiringTags, setDesiringTags] = useState([]);

    async function test_fetch(){
        const token = localStorage.getItem('access_token');
        const response = await fetch(window.server_url+'/player_info', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await response.json();
        console.log("PLAYER INFO:", data);
    }

    async function define_profile_info(self_tags, desiring_tags){
        const token = localStorage.getItem('access_token');
        const response = await fetch(window.server_url+'/set_profile_info', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            mode: 'cors',
            body: JSON.stringify({
                tags_work: [self_tags],
                tags_desiring_work: [desiring_tags]
            })

        });

        const data = await response.json();
        console.log("SET PROFILE INFO:", data);

    }




    async function leaveLobby(){
        try {
            const token = localStorage.getItem('access_token');
            cancelSound();
            const response = await fetch(window.server_url+'/disconnect_lobby', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                navigate('/');
            }
        } catch (error) {
            console.error("Error disconnecting from lobby:", error);
            navigate('/');
        } finally {
            cancelSound();
            navigate('/');
            console.log("finally");
        }
    }

    useEffect(() => {
        if (!checkSound()) {
            setSoundEnabled(false);
        } else {
            setSoundEnabled(true);
        }

        const interval = setInterval(async () => {
            try {

                isFetchingCounter.current+=1;
                if (isFetchingCounter.current>5) {
                    isFetchingCounter.current=0;
                    isFetchingProfile.current=false;
                }
                const token = localStorage.getItem('access_token');
                const isTabVisible = !document.hidden;
                // const response = await fetch(window.server_url+'/lobby?is_visible='+isTabVisible, {
                const response = await fetch(window.server_url+'/lobby?is_visible=true', {

                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'is_visible_t_f': (isTabVisible)?"t":"f"
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    console.log("LOBBY PAIR DATA:", data);
                    if (data.status=="inactive"){
                        cancelSound();
                        navigate('/');
                    }

                    setOpponentName(data.opponent_name);
                    if (data.opponent_name==null) {
                        setOpponentProfile(null);
                    }
                    setLobbyState(data.lobby_state);
                    roundPosition.current = data.round_time_left;
                    setRoundTimeLeft(data.round_time_left);

                    setTableNumber(data.table_number);
             
                    if ((roundPosition.current!=null) && (data.lobby_state=="active")) {
                        seekTo(playat-roundPosition.current);
                        console.log("seeking to", playat-roundPosition.current);
                    }


                    // if (opponentName!=null) {
                    //     setPrevOpponentName(opponentName);
                    // }else{
                    //     setOpponentName(null);
                    //     //setOpponentProfile(null);
                    // }


                    if ((opponentName!=data.opponent_name) || (opponentProfile==null)) {
                        if ((!isFetchingProfile.current) && (data.opponent_name!=null)) {
                            isFetchingProfile.current=true;
                            console.log("fetching profile");
                            const profile_response=await fetch(window.server_url+'/paired_player_profile', {
                                headers: {
                                    'Authorization': `Bearer ${token}`
                                }
                            });
                            if (profile_response.ok) {
                                const profile_data=await profile_response.json();
                                setOpponentProfile(profile_data);
                                console.log("profile fetched:", profile_data.name);
                            }else{
                                console.log("profile fetch failed");
                            }
                            isFetchingProfile.current=false;
                        }
                    }
                }
            } catch (error) {
                console.error("Error fetching lobby data:", error);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    const SoundPrompt = () => {
        return (
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 1000
            }}>
                <div style={{
                    backgroundColor: 'white',
                    padding: '20px',
                    borderRadius: '8px',
                    position: 'relative',
                    minWidth: '300px'
                }}>
                    <button 
                        onClick={() => setShowSoundPrompt(false)}
                        style={{
                            color: '#144fff',
                            position: 'absolute',
                            right: '10px',
                            top: '10px',
                            border: 'none',
                            background: 'none',
                            fontSize: '20px',
                            cursor: 'pointer'
                        }}
                    >
                    X   
                    </button>
                    <h2 style={{ marginTop: '20px' }}>Enable Sound</h2>
                    <p style={{
                            color: '#144dff',
                        }}>Please enable sound for the best experience</p>
                    <button 
                        onClick={() => {
                            loadSound();
                            setShowSoundPrompt(false);
                        }}
                        style={{
                            padding: '10px 20px',
                            marginTop: '20px',
                            backgroundColor: '#007bff',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        Enable Sound
                    </button>
                </div>
            </div>
        );
    };

    const handleTagChange = (tagType, tag) => {
        if (tagType === 'self') {
            setSelfTags(prev => 
                prev.includes(tag) 
                    ? prev.filter(t => t !== tag)
                    : [...prev, tag]
            );
        } else {
            setDesiringTags(prev => 
                prev.includes(tag) 
                    ? prev.filter(t => t !== tag)
                    : [...prev, tag]
            );
        }
    };

    return (
        <div className="lobby-container">
            <div className="lobby-content">
                <div className="lobby-header">
                    <h1>
                        {lobbyState === "active" 
                            ? opponentName 
                                ? `Pair up with ${opponentName}`
                                : "You will be paired with someone in the next round."
                            : lobbyState === "checkin"
                                ? "You made it. Get ready to pair up!"
                                : "Please wait for the next round to start"}
                    </h1>
                    {lobbyState !== "checkin" && roundTimeLeft && (
                        <div className="time-left" style={{display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'white'}}>
                            <CountdownCircleTimer
                                key={`${lobbyState}-${Math.floor(roundTimeLeft)}`}
                                isPlaying={lobbyState === "active"}
                                duration={300}
                                initialRemainingTime={roundTimeLeft}
                                colors={["#144dff"]} 
                                size={100}
                                strokeWidth={10}
                                trailColor="#f5f7ff"
                                onComplete={() => {
                                    return { shouldRepeat: false }
                                }}
                            >
                                {({ remainingTime }) => (
                                    <span style={{ fontSize: '1.2rem', color: '#144dff', fontWeight: 600 }}>
                                        {Math.ceil(remainingTime)}s
                                    </span>
                                )}
                            </CountdownCircleTimer>
                            {/* <span style={{color: '#144dff'}}>{parseInt(roundTimeLeft)}s</span> */}
                            <span style={{ fontSize: '0.9em', marginTop: '4px', opacity: '0.8', color: '#144dff' }}>time remaining</span>
                        </div>
                    )}
                </div>

                <div className="player-section">
                    {lobbyState === "active" ? (
                        opponentProfile ? (
                            <>
                                <div className="table-number">
                                    <h2>Table Number: {tableNumber}</h2>
                                </div>
                                <PlayerCard player={opponentProfile} />
                            </>

                        ) : (
                            <div className="status-message">
                                <h2>
                                {prevOpponentProfile ? 
                                 `Previous round was with ${prevOpponentProfile.name}` :
                                 'Get ready to meet someone new!'}
                                </h2>
                            </div>
                        )

                    ) : (
                        <div className="status-message">
                            <h2>Please wait for your Host to start the session</h2>
                        </div>
                    )}
                </div>
                <button className="leave-lobby-button" onClick={leaveLobby}>Leave Lobby</button>
                <div className="top-buttons">
                    <button className="secondary-button" onClick={loadSound}>
                        {soundEnabled ? 'Sound On' : 'Sound Off'}
                    </button>
                    <button className="primary-button" onClick={test_fetch}>test</button>
                </div>

                <form onSubmit={(e) => {
                    e.preventDefault();
                    define_profile_info(selfTags.join(','), desiringTags.join(','));
                }}>
                    <div className="tags-section">
                        <div className="tag-group">
                            <h3>Who do you do?</h3>
                            {AVAILABLE_TAGS.map(tag => (
                                <label key={`self-${tag}`} className="tag-label">
                                    <input
                                        type="checkbox"
                                        checked={selfTags.includes(tag)}
                                        onChange={() => handleTagChange('self', tag)}
                                    />
                                    {tag}
                                </label>
                            ))}
                        </div>
                        <div className="tag-group">
                            <h3>Looking For?</h3>
                            {AVAILABLE_TAGS.map(tag => (
                                <label key={`desiring-${tag}`} className="tag-label">
                                    <input
                                        type="checkbox"
                                        checked={desiringTags.includes(tag)}
                                        onChange={() => handleTagChange('desiring', tag)}
                                    />
                                    {tag}
                                </label>
                            ))}
                        </div>
                    </div>
                    <div className="button-group">
                        <button className="primary-button" type="submit">
                            Define Profile
                        </button>
                    </div>
                </form>
            </div>

            {(soundEnabled || !showSoundPrompt) ? null : <SoundPrompt />}
        </div>
    );
}

export default LobbyScreen;
