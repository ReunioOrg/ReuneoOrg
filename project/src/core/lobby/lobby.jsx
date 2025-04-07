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
    "Software Engineer",
    "Content Creator",
    "Business",
    "AI",
    "Engineer",
    "Artist or Designer",
    "Investor",
    "Sales or Marketing",
    "Finance",
    "Law"
];

const useEffectTime=5000;



const LobbyScreen = () => {
    
    const { audioRef, error, playSound, loadSound, seekTo, cancelSound, checkSound, soundEnabled, setSoundEnabled, isPlaying } = usePlaySound();

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

    const [selfTags, setSelfTags] = useState(null);
    const [desiringTags, setDesiringTags] = useState(null);

    const [serverselfTags, setServerselfTags] = useState([]);
    const [serverdesiringTags, setServerdesiringTags] = useState([]);

    // Add this new state to track page visibility
    const [isPageVisible, setIsPageVisible] = useState(!document.hidden);

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
                tags_work: self_tags,
                tags_desiring_work: desiring_tags
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

    async function fetchLobbyData(){
        try {
            isFetchingCounter.current+=1;
            if (isFetchingCounter.current>5) {
                isFetchingCounter.current=0;
                isFetchingProfile.current=false;
            }
            const token = localStorage.getItem('access_token');
            const isTabVisible = !document.hidden;
            // const response = await fetch(window.server_url+'/lobby?is_visible='+isTabVisible, {
            const response = await fetch(window.server_url+'/lobby?is_visible='+isTabVisible, {
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


                // Set Tags
                if ((data.player_tags!=null) && (data.player_tags.tags_work!=null)) {
                    setServerselfTags(data.player_tags.tags_work);
                }
                if ((data.player_tags!=null) && (data.player_tags.desiring_tags_work!=null)) {
                    setServerdesiringTags(data.player_tags.desiring_tags_work);
                }
    
                if ((roundPosition.current!=null) && (data.lobby_state=="active")) {
                    if (roundPosition.current!=0) {
                        seekTo(playat-roundPosition.current);
                        console.log("seeking to", playat-roundPosition.current);
                    }
                }

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
    }

    useEffect(() => {
        if (!checkSound()) {
            setSoundEnabled(false);
        } else {
            setSoundEnabled(true);
        }

        const interval = setInterval(async () => {
            fetchLobbyData();
        }, useEffectTime);

        return () => clearInterval(interval);
    }, []);

    // Add this new useEffect that runs whenever lobbyState changes
    useEffect(() => {

        // Add a small delay to ensure server state is updated
        const timeoutId = setTimeout(fetchLobbyData, 1000);
        
        return () => clearTimeout(timeoutId);
    }, [lobbyState]); // This will run whenever lobbyState changes

    // When page becomes visible again, fetch latest lobby data
    useEffect(() => {
        const handleVisibilityChange = () => {
            const isVisible = !document.hidden;
            
            // If page is becoming visible (was hidden before), fetch latest
            if (isVisible && !isPageVisible) {
                console.log("Page became visible - fetching latest data");
                fetchLobbyData();
            }
            
            setIsPageVisible(isVisible);
        };
        
        document.addEventListener("visibilitychange", handleVisibilityChange);
        
        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, [isPageVisible]);

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
        if (selfTags==null) {
            setSelfTags(serverselfTags);
        }
        if (desiringTags==null) {
            setDesiringTags(serverdesiringTags);
        }
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

    useEffect(() => {
        if ((selfTags!=null) && (desiringTags!=null)) {
            define_profile_info(selfTags, desiringTags);
        }
    }, [selfTags, desiringTags]);

    return (
        <div className="lobby-container">
            <div className="lobby-content">
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    marginBottom: '0',
                    marginTop: '.5rem'
                }}>
                    <img 
                        src="/assets/reunio-game-logo-1.png"
                        alt="Reunio Logo"
                        style={{
                            maxWidth: '100px',
                            height: 'auto',
                            objectFit: 'contain'
                        }}
                    />
                </div>

                {lobbyState !== "checkin" && (
                    <div className="time-left" style={{display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'white'}}>
                        {((lobbyState === "active" || lobbyState === "interrim") && roundTimeLeft) ? (
                            <>
                                <CountdownCircleTimer
                                    key={`${lobbyState}-${Math.floor(roundTimeLeft)}`}
                                    isPlaying={lobbyState === "active"}
                                    duration={300}
                                    initialRemainingTime={roundTimeLeft}
                                    colors={["#144dff"]} 
                                    size={80}
                                    strokeWidth={10}
                                    trailColor="#f5f7ff"
                                    onComplete={() => {
                                        fetchLobbyData();
                                        return { shouldRepeat: false }
                                    }}
                                    
                                >
                                    {({ remainingTime }) => (
                                        <span style={{ fontSize: '.95rem', color: '#144dff', fontWeight: 600 }}>
                                            {Math.ceil(remainingTime)}s
                                        </span>
                                    )}
                                </CountdownCircleTimer>
                                {/* <span style={{color: '#144dff'}}>{parseInt(roundTimeLeft)}s</span> */}
                                <span style={{ fontSize: '0.7em', marginTop: '4px', opacity: '1', color: '#144dff' }}>time remaining</span>
                                <div style={{ height: '10px' }}></div>
                                {opponentProfile && (
                                    <div className="table-number">
                                        <h3>Go to table: {tableNumber}</h3>
                                    </div>
                                )}
                            </>
                        ) : (
                            <span className="time-left-text"></span>
                        )}
                    </div>
                )}

                <div style={{display: 'flex', justifyContent: 'center', width: '100%', margin: '0 auto'}}>
                    {(lobbyState === "active" || lobbyState === "interrim") ? (
                        opponentProfile ? (
                            <div style={{marginTop: '-3.5rem', width: '100%', display: 'flex', justifyContent: 'center'}}>
                                <PlayerCard player={opponentProfile} />
                            </div>
                        ) : (
                           <>
                           
                           </>
                        )

                    ) : (
                        lobbyState === "terminated" ? (
                            <div className="status-message">
                                <h2>This session has ended.
                                <br />Thank you for participating!</h2>
                            </div>
                        ) : null
                    )}
                </div>

                <div className="lobby-header" style={{marginTop: '-30px'}}>
                    <h2>
                        {lobbyState === "checkin" ? (
                            `You're in ${userProfile.name.length > 30 ? `${userProfile.name.slice(0, 15)}` : userProfile.name}! Please wait for your host to start the session.`
                        ) : lobbyState === "active" ? (
                            opponentName 
                                ? `Pair up with ${opponentName}`
                                : "You will be paired with someone in the next round."
                        ) : lobbyState === "interrim" ? (
                            "Get ready for the next round!"
                        ) : lobbyState === "terminate" ? (
                            "This session has ended. Thank you for participating!"
                        ) : (
                            "Please wait for the next round to start"
                        )}
                    </h2>
                </div>

                <button className="leave-lobby-button" onClick={leaveLobby}>Leave Lobby</button>

                <form onSubmit={(e) => {
                    e.preventDefault();
                    console.log("SELF TAGS:", selfTags);
                    console.log("DESIRING TAGS:", desiringTags);
                    if ((selfTags!=null) && (desiringTags!=null)) {
                        define_profile_info(selfTags, desiringTags);
                    } else{
                        define_profile_info(serverselfTags, serverdesiringTags);
                    }
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }}>
                    <div className="tags-section">  
                        <div className="tag-group">
                            <div className="bounce-wrapper">
                                <h3>Help us match you with the right people.</h3>
                            </div>
                            <div className="bounce-wrapper">
                                <h3>What do you do?</h3>
                            </div>
                            <div className="tag-labels-container">
                                {AVAILABLE_TAGS.map(tag => (
                                    <label key={`self-${tag}`} className="tag-label">
                                        <input
                                            type="checkbox"
                                            //checked={false}
                                            //checked={serverselfTags.includes('Founder')}
                                            checked={(selfTags!=null)?selfTags.includes(tag):serverselfTags.includes(tag)}
                                            onChange={() => handleTagChange('self', tag)}
                                        />
                                        {tag}
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div className="tag-group">
                            <div className="bounce-wrapper">
                                <h3>What are you looking for?</h3>
                            </div>
                            <div className="tag-labels-container">
                                {AVAILABLE_TAGS.map(tag => (
                                    <label key={`desiring-${tag}`} className="tag-label">
                                        <input
                                            type="checkbox"
                                            //checked={(serverselfTags!=null)?serverselfTags.includes(tag):serverdesiringTags.includes(tag)}
                                            checked={(desiringTags!=null)?desiringTags.includes(tag):serverdesiringTags.includes(tag)}
                                            onChange={() => handleTagChange('desiring', tag)}
                                        />
                                        {tag}
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                    {/* <div className="button-group">
                        <button className="primary-button" type="submit">
                            Save Profile
                        </button>
                    </div> */}
                </form>

                <div className="bottom-buttons" style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '1rem',
                    marginTop: '1rem',
                    flexWrap: 'wrap',
                    padding: '0 1rem'
                }}>
                    {/* <button className="primary-button" onClick={test_fetch}>test</button> */}
                    <button className="secondary-button" onClick={loadSound}>
                        {soundEnabled ? 'Sound On' : 'Sound Off'}
                    </button>
                </div>
            </div>

            {(soundEnabled || !showSoundPrompt) || (lobbyState == "checkin") || (lobbyState == null) || isPlaying ? null : <SoundPrompt />}
        </div>
    );
}

export default LobbyScreen;
