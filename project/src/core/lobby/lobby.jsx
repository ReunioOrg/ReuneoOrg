import React, { useEffect, useState, useRef } from 'react';
import { AuthContext } from '../Auth/AuthContext';
import usePlaySound from '../playsound';
import { useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PlayerCard from './playerCard';
import './lobby.css';
import { CountdownCircleTimer } from "react-countdown-circle-timer";
import useGetLobbyMetadata from './get_lobby_metadata';
import LobbyCountdown from './lobby_countdown';
import HowToTutorial from './how_to_tutorial';

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
    const [lobbyCode, setLobbyCode] = useState('yonder');
    const navigate = useNavigate();
    const { code } = useParams();
    const [player_count, setPlayerCount] = useState(null);
    useGetLobbyMetadata(setPlayerCount, null, lobbyCode);
    const { user, userProfile, checkAuth, permissions } = useContext(AuthContext);

    // Add useEffect to check authentication and redirect if needed
    useEffect(() => {
        const checkAuthentication = async () => {
            const token = localStorage.getItem('access_token');
            if (!token) {
                // User is not authenticated, redirect to signup page
                const params = new URLSearchParams(window.location.search);
                const codeParam = params.get('code') || code;
                if (codeParam) {
                    // Redirect to signup with the lobby code as a redirect parameter
                    navigate(`/signup?redirect=lobby&code=${codeParam}`);
                } else {
                    navigate('/signup?redirect=lobby');
                }
            } else {
                // Verify token is valid - only do this once when component mounts
                try {
                    // Only check auth if we don't already have user data
                    if (!user) {
                        await checkAuth();
                    }
                } catch (error) {
                    console.error("Authentication error:", error);
                    // If token is invalid, redirect to signup
                    const params = new URLSearchParams(window.location.search);
                    const codeParam = params.get('code') || code;
                    if (codeParam) {
                        navigate(`/signup?redirect=lobby&code=${codeParam}`);
                    } else {
                        navigate('/signup?redirect=lobby');
                    }
                }
            }
        };
        
        checkAuthentication();
    }, [navigate, code, checkAuth, user]); // Add user to dependencies

    useEffect(() => {
        const checkParams = () => {
            const params = new URLSearchParams(window.location.search);
            const codeParam = params.get('code') || code;      
            if (codeParam) {
                setLobbyCode(codeParam);

                // Immediate fetch when lobby code is set, this way we can get the player count immediately
                const token = localStorage.getItem('access_token');
                fetch(`${window.server_url}/display_lobby_metadata?lobby_code=${codeParam}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'lobby_code': codeParam
                    }
                })
                .then(response => response.json())
                .then(data => {
                    setPlayerCount(data.player_count);
                })
                .catch(error => console.error("Error fetching initial lobby metadata:", error));

            }
        };
        checkParams(); // Initial check        
        // Set up interval to check every 100ms
        const interval = setInterval(checkParams, 200);
        
        // Cleanup interval on unmount
        return () => clearInterval(interval);
    }, [code]); // Remove lobbyCode from dependencies to prevent re-renders

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

    const [selfTags, setSelfTags] = useState(null);
    const [desiringTags, setDesiringTags] = useState(null);

    const [serverselfTags, setServerselfTags] = useState([]);
    const [serverdesiringTags, setServerdesiringTags] = useState([]);

    // Add this new state to track page visibility
    const [isPageVisible, setIsPageVisible] = useState(!document.hidden);

    // Add this ref near your other state declarations
    const lobbyCodeRef = useRef('yonder');

    // Update the ref whenever lobbyCode changes
    useEffect(() => {
        lobbyCodeRef.current = lobbyCode;
    }, [lobbyCode]);

    // Add this new state for the lobby profile images//TODO once API is ready
    // const [profiles, setLobbyProfiles] = useState([]);
    
    // // Add this new function to fetch profile images
    // const fetchLobbyProfiles = async () => {
    //     try {
    //         const token = localStorage.getItem('access_token');
    //         const response = await fetch(`${window.server_url}/lobby_profiles`, {
    //             headers: {
    //                 'Authorization': `Bearer ${token}`,
    //                 'lobby_code': lobbyCode
    //             }
    //         });
            
    //         if (response.ok) {
    //             const data = await response.json();
    //             setLobbyProfiles(data.profiles || [{ id: 1 }, { id: 2 }, { id: 3 }]); // Add dummy profiles for testing
    //         } else {
    //             console.error("Failed to fetch lobby profiles");
    //             setLobbyProfiles([{ id: 1 }, { id: 2 }, { id: 3 }]); // Add dummy profiles for testing
    //         }
    //     } catch (error) {
    //         console.error("Error fetching lobby profiles:", error);
    //         setLobbyProfiles([{ id: 1 }, { id: 2 }, { id: 3 }]); // Add dummy profiles for testing
    //     }
    // };

    // Add useEffect to fetch profiles periodically
    // useEffect(() => {
    //     if (lobbyCode && (lobbyState === "checkin" || lobbyState === "active")) {
    //         fetchLobbyProfiles();
    //         const interval = setInterval(fetchLobbyProfiles, 5000); // Fetch every 5 seconds
    //         return () => clearInterval(interval);
    //     }
    // }, [lobbyCode, lobbyState]);

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
                    'Authorization': `Bearer ${token}`,
                    'lobby_code': lobbyCode
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
            // Use the ref value instead of the state directly
            const currentLobbyCode = lobbyCodeRef.current;
            console.log("lobby code fr:", currentLobbyCode);
            if (currentLobbyCode=="yonder") {
                console.log("lobby code is not set");
                return;
            }

            const response = await fetch(`${window.server_url}/lobby?is_visible=${isTabVisible}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'is_visible_t_f': (isTabVisible)?"t":"f",
                    'lobby_code': currentLobbyCode
                }
            });
            
            if (response.ok) {                    
                const data = await response.json();
                console.log("LOBBY PAIR DATA:",currentLobbyCode, data);
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
    }, []); // Empty dependency array to create interval only once

    // Add this new useEffect that runs whenever lobbyState changes
    useEffect(() => {

        // Add a small delay to ensure server state is updated
        const timeoutId = setTimeout(fetchLobbyData, 1000);
        
        return () => clearTimeout(timeoutId);
    }, [lobbyState, lobbyCode]); // This will run whenever lobbyState changes

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

    // Add this state to track if we should show the animation
    const [showLobbyCountdown, setShowLobbyCountdown] = useState(false);
    
    // Add this effect to handle the interrim state
    useEffect(() => {
        if (lobbyState === "interrim") {
            setShowLobbyCountdown(true);
        } else if (lobbyState === "active") {
            // Keep the animation visible for a moment after state changes to active
            const timer = setTimeout(() => {
                setShowLobbyCountdown(false);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [lobbyState]);
    
    // Add this handler for when the animation completes
    const handleLobbyCountdownComplete = () => {
        // You can add any additional logic here
        console.log("Lobby countdown animation completed");
    };

    // Add this state to track if we should show the tutorial
    const [showTutorial, setShowTutorial] = useState(false);
    
    // Add this effect to check if the tutorial should be shown
    useEffect(() => {
        // Check if the user has seen the tutorial before
        const hasSeenTutorial = localStorage.getItem('hasSeenTutorial');
        
        if (!hasSeenTutorial) {
            // Show the tutorial if the user haven't seen it before
            setShowTutorial(true);
            
            // Mark that the user has seen the tutorial
            localStorage.setItem('hasSeenTutorial', 'true');
        }
    }, []);
    
    // Add this handler for when the tutorial completes
    const handleTutorialComplete = () => {
        setShowTutorial(false);
    };

    return (
        <div className="lobby-container">
            <div className="lobby-content">
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    marginBottom: '0',
                    marginTop: '-1.5rem'
                }}>
                    <img 
                        src="/assets/reunio-game-logo-1.png"
                        alt="Reunio Logo"
                        style={{
                            maxWidth: '85px',
                            height: 'auto',
                            objectFit: 'contain'
                        }}
                    />
                </div>

                {lobbyState !== "checkin" && (
                    <div className="time-left" style={{display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'white', marginTop: '-2rem'}}>
                        {((lobbyState === "active" || lobbyState === "interrim") && roundTimeLeft) ? (
                            <>
                                <CountdownCircleTimer
                                    key={`${lobbyState}-${Math.floor(roundTimeLeft)}`}
                                    isPlaying={lobbyState === "active"}
                                    duration={300}
                                    initialRemainingTime={roundTimeLeft}
                                    colors={["#144dff"]} 
                                    size={90}
                                    strokeWidth={12}
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
                                <span style={{ fontSize: '0.7em', marginTop: '4px', opacity: '1', color: '#144dff' }}>round time left</span>
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
                            <div style={{marginTop: '-4.5rem', width: '100%', display: 'flex', justifyContent: 'center'}}>
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

                {/* Player Count Display */}
                {((lobbyState === "checkin") || (lobbyState === "active" && !opponentProfile)) && player_count !== null && (
                    <div className="player-count-container">
                        <div className="player-count-bubble">
                            <div className="player-count-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <img 
                                    src="/assets/player_count_icon_shadow.png" 
                                    alt="Players in lobby" 
                                    className="player-count-img" 
                                    style={{ width: '40px', height: '40px', objectFit: 'contain' }}
                                />
                            </div>
                            <div className="player-count-text">
                                <span className="player-count-number">{player_count}</span>
                                <span className="player-count-label">
                                    {player_count === 1 ? 'person' : 'people'} in {lobbyCode} lobby
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Profile Images to Display in Lobby*/}
                {((lobbyState === "checkin") || (lobbyState === "active" && !opponentProfile)) && (
                    <div className="lobby-profiles-container">
                        <div className="lobby-profiles-grid">
                            {player_count > 0 ? (
                                Array.from({ length: player_count }).map((_, index) => (
                                    <div 
                                        key={`profile-${index}`}
                                        className={`profile-icon-wrapper ${index === player_count - 1 ? 'pop-in' : ''}`}
                                    >
                                        <img 
                                            src="/assets/player_count_icon_color.png"
                                            alt={`Profile ${index + 1}`}
                                            className="profile-icon"
                                        />
                                        <div className="profile-icon-glow"></div>
                                    </div>
                                ))
                            ) : (
                                <div>No profiles to display</div>
                            )}
                        </div>
                        
                    </div>
                )}

                <div className="lobby-header" style={{marginTop: '-50px'}}>
                    <h2>
                        {lobbyState === "checkin" ? (
                            <>
                                You're in {userProfile.name.length > 30 ? userProfile.name.slice(0, 15) : userProfile.name}!
                                <br />
                                Your host will start the game shorty.
                            </>
                        ) : lobbyState === "active" && !opponentProfile ? (
                            "You will be paired with someone in the next round."
                        ) : lobbyState === "interrim" ? (
                            "Get ready for the next round!"
                        ) : lobbyState === "terminated" ? (
                            "This session has ended. Thank you for participating!"
                        ) : (
                            ""
                        )}
                    </h2>
                </div>

                {/* Display tags in checkin or active state */}
                {(lobbyState === "checkin" || lobbyState === "active") && (
                    <div className="selected-tags-container">
                        {(selfTags && selfTags.length > 0) && (
                            <div className="tag-category">
                                <h4>What I do:</h4>
                                <div className="tag-list">
                                    {selfTags.map(tag => (
                                        <span key={`self-${tag}`} className="tag-item">{tag}</span>
                                    ))}
                                </div>
                            </div>
                        )}
                        {(desiringTags && desiringTags.length > 0) && (
                            <div className="tag-category">
                                <h4>Looking for:</h4>
                                <div className="tag-list">
                                    {desiringTags.map(tag => (
                                        <span key={`desiring-${tag}`} className="tag-item">{tag}</span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <button className="leave-lobby-button" onClick={leaveLobby}>Leave Lobby</button>
                <button className="how-to-tutorial-button" onClick={() => setShowTutorial(true)}>Tutorial</button>
                {permissions === "admin" && (
                    <button 
                        className="admin-view-button" 
                        onClick={() => navigate(`/admin_lobby_view?code=${lobbyCode}`)}
                    >
                        Admin View
                    </button>
                )}

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

            {/* Add the animation component */}
            {showLobbyCountdown && (
                <LobbyCountdown onComplete={handleLobbyCountdownComplete} />
            )}

            {/* Add the tutorial component */}
            {showTutorial && (
                <HowToTutorial onComplete={handleTutorialComplete} />
            )}
        </div>
    );
}

export default LobbyScreen;
