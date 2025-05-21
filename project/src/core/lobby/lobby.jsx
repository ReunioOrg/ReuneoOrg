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
import ShowMatchAnimation from './show_match_animation';

const AVAILABLE_TAGS = []; // Remove hardcoded tags
const MAX_VISIBLE_PROFILES = 9; // Adjust this number to experiment with different limits
const MAX_TAGS_ALLOWED = 5; // Maximum number of tags allowed for both self and desiring tags
const useEffectTime=5000;

const LobbyScreen = () => {
    const [tagsState, setTagsState] = useState([]);
    const [selectionPhase, setSelectionPhase] = useState('self');
    const [hasScrolledToTags, setHasScrolledToTags] = useState(false);
    const [tagLimitWarning, setTagLimitWarning] = useState('');
    const desiringTagsRef = useRef(null);
    const continueButtonRef = useRef(null);
    
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

                // Check if the user has seen the tutorial for this specific lobby
                const lobbyTutorialKey = `hasSeenTutorial_${codeParam}`;
                const hasSeenLobbyTutorial = localStorage.getItem(lobbyTutorialKey);
                const isAuthenticated = !!localStorage.getItem('access_token');
                
                console.log("Tutorial check:", { 
                    codeParam, 
                    lobbyTutorialKey, 
                    hasSeenLobbyTutorial,
                    isAuthenticated
                });
                
                // Only show tutorial if user is authenticated and hasn't seen it for this lobby
                if (!hasSeenLobbyTutorial && isAuthenticated) {
                    // Show the tutorial if the user hasn't seen it for this lobby
                    setShowTutorial(true);
                    
                    // Mark that the user has seen the tutorial for this lobby
                    localStorage.setItem(lobbyTutorialKey, 'true');
                }
            }
        };
        checkParams(); // Initial check for tutorial and lobby code setup only
    }, [code]); // Remove the interval since we're now handling metadata in fetchLobbyData

    const [opponentProfile, setOpponentProfile] = useState(null);
    const [prevOpponentProfile, setPrevOpponentProfile] = useState(null);

    const [opponentName, setOpponentName] = useState(null);
    const [prevOpponentName, setPrevOpponentName] = useState(null);

    const [tableNumber, setTableNumber] = useState(null);

    const isFetchingProfile=useRef(false);

    const roundPosition = useRef(null);
    const [lobbyState, setLobbyState] = useState(null);
    const [roundTimeLeft, setRoundTimeLeft] = useState(null);
    const [roundDisplayTime, setRoundDisplayTime] = useState(null);
    const [roundDuration, setRoundDuration] = useState(null);
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

    const [showMatchAnimation, setShowMatchAnimation] = useState(false);
    const [prevLobbyState, setPrevLobbyState] = useState(null);
    const isAnimating = useRef(false);  // Add this ref to track animation state

    // Add this function to check for matches
    const checkForMatches = (playerTags, opponentTags) => {
        if (!playerTags || !opponentTags) return false;

        // Check if player's self tags match opponent's desiring tags
        const playerSelfMatch = playerTags.tags_work.some(tag => 
            opponentTags.desiring_tags_work.includes(tag)
        );

        // Check if opponent's self tags match player's desiring tags
        const opponentSelfMatch = opponentTags.tags_work.some(tag => 
            playerTags.desiring_tags_work.includes(tag)
        );

        return playerSelfMatch && opponentSelfMatch;
    };

    // Modify the fetchLobbyData function to include match detection
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

            // First fetch lobby data
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
                setTagsState(data.custom_tags);
                setLobbyState(data.lobby_state);
                setRoundDuration(data.lobby_duration);
                
                // Add validation check for round_time_left to ensure it's a valid number
                const timeLeft = typeof data.round_time_left === 'number' && !isNaN(data.round_time_left) 
                    ? data.round_time_left 
                    : 0;
                
                console.log("Timer Debug:", {
                    roundDuration: data.lobby_duration,
                    timeLeft: timeLeft,
                    lobbyState: data.lobby_state,
                    usingDefaultDuration: !data.lobby_duration
                });
                
                roundPosition.current = timeLeft;
                setRoundTimeLeft(Math.floor(timeLeft));
                
                // Format the time display with validation
                const minutes = Math.floor(timeLeft / 60);
                const seconds = Math.floor(timeLeft % 60);
                setRoundDisplayTime(`${minutes}:${seconds.toString().padStart(2, '0')}`);
                
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

                // Also fetch metadata in the same cycle
                const metadataResponse = await fetch(`${window.server_url}/display_lobby_metadata?lobby_code=${currentLobbyCode}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'lobby_code': currentLobbyCode
                    }
                });
                
                if (metadataResponse.ok) {
                    const metadataData = await metadataResponse.json();
                    setPlayerCount(metadataData.player_count);
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

                // Check for state change from interrim to active
                if (prevLobbyState === "interrim" && 
                    data.lobby_state === "active" && 
                    data.opponent_name && 
                    !isAnimating.current) {
                    console.log('Checking for matches...');
                    const hasMatch = checkForMatches(data.player_tags, data.opponent_tags);
                    if (hasMatch) {
                        console.log('Match found! Setting animation...');
                        isAnimating.current = true;
                        setShowMatchAnimation(true);
                    }
                }
                
                setPrevLobbyState(data.lobby_state);
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

        // Single polling mechanism for all lobby data
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
                            fontSize: '2px',
                            cursor: 'pointer'
                        }}
                    >
                    X   
                    </button>
                    <h2 style={{ marginTop: '5px' }}>The Sound is Important</h2>
                    <h3 style={{ marginTop: '5px' }}>Raise your volume also</h3>
                    <p style={{
                            color: '#144dff',
                        }}>You'll need this for the best experience.</p>
                    <button 
                        onClick={() => {
                            loadSound();
                            setShowSoundPrompt(false);
                        }}
                        style={{
                            padding: '10px 20px',
                            marginTop: '20px',
                            backgroundColor: '#144dff',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '14px',
                            fontWeight: 'bold',
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

        const currentTags = tagType === 'self' ? selfTags : desiringTags;
        const isAdding = !currentTags?.includes(tag);

        if (isAdding && currentTags?.length >= MAX_TAGS_ALLOWED) {
            setTagLimitWarning('Reached tag limit for this section');
            // Scroll to continue/save button
            setTimeout(() => {
                continueButtonRef.current?.scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'center'
                });
            }, 100);
            // Clear warning after 3 seconds
            setTimeout(() => {
                setTagLimitWarning('');
            }, 3000);
            return;
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

    const handleContinue = () => {
        if (selfTags != null) {
            define_profile_info(selfTags, desiringTags || []);
        }
        setSelectionPhase('desiring');
        
        // Add scroll behavior after a short delay to ensure phase transition is complete
        setTimeout(() => {
            desiringTagsRef.current?.scrollIntoView({ 
                behavior: 'smooth',
                block: 'start'
            });
        }, 100);
    };

    const handleSave = () => {
        if (desiringTags != null) {
            define_profile_info(selfTags || [], desiringTags);
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleBack = () => {
        setSelectionPhase('self');
    };

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
    
    // Add this handler for when the tutorial completes
    const handleTutorialComplete = () => {
        setShowTutorial(false);
    };

    const tagsSectionRef = useRef(null);

    // Add useEffect to scroll to tags if no server tags exist and custom tags are available
    useEffect(() => {
        if (!hasScrolledToTags && !serverselfTags?.length && !serverdesiringTags?.length && tagsState?.length > 0) {
            tagsSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
            setHasScrolledToTags(true);
        }
    }, [serverselfTags, serverdesiringTags, tagsState, hasScrolledToTags]);

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
                        src="/assets/reuneo_test_8.png"
                        alt="Reunio Logo"
                        style={{
                            maxWidth: '85px',
                            height: 'auto',
                            objectFit: 'contain'
                        }}
                    />
                </div>

                {/* User Profile Picture */}
                {(lobbyState === "checkin" || (lobbyState === "active" && !opponentProfile) || lobbyState === "interrim") && (
                    <div className="user-profile-container">
                        <div className="user-profile">
                            <img 
                                src={userProfile?.image_data ? `data:image/jpeg;base64,${userProfile.image_data}` : "/assets/avatar_3.png"} 
                                alt="Your Profile" 
                                className="user-profile-picture"
                            />
                            <div className="user-profile-glow"></div>
                        </div>
                    </div>
                )}

                <div className="lobby-header" style={{marginTop: '-50px'}} key={lobbyState}>
                    <h2>
                        {lobbyState === "active" && opponentProfile ? (
                            <span className="lobby-pop-burst">
                                Go find {opponentProfile.name}!
                            </span>
                        ) : lobbyState === "checkin" ? (
                            <>
                                You're in {userProfile.name.slice(0, 15)}!
                                <br />
                                Your host will start the experience.
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

                {lobbyState !== "checkin" && (
                    <div className="time-left" style={{display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'white', marginTop: '-2rem'}}>
                        {((lobbyState === "active" || lobbyState === "interrim") && roundTimeLeft) ? (
                            <>
                                <CountdownCircleTimer
                                    key={`${lobbyState}-${roundTimeLeft}`}
                                    isPlaying={lobbyState === "active"}
                                    duration={roundDuration || 300}
                                    initialRemainingTime={roundTimeLeft || 0}
                                    colors={["#144dff"]} 
                                    size={90}
                                    strokeWidth={12}
                                    trailColor="#f5f7ff"
                                    onComplete={() => {
                                        fetchLobbyData();
                                        return { shouldRepeat: false }
                                    }}
                                    
                                >
                                    {({ remainingTime }) => {
                                        // Ensure remainingTime is a valid number
                                        const validTime = typeof remainingTime === 'number' && !isNaN(remainingTime) ? remainingTime : 0;
                                        const mins = Math.floor(validTime / 60);
                                        const secs = Math.floor(validTime % 60);
                                        return (
                                            <span style={{ fontSize: '.95rem', color: '#144dff', fontWeight: 600 }}>
                                                {mins}:{String(secs).padStart(2, '0')}
                                            </span>
                                        );
                                    }}
                                </CountdownCircleTimer>
                                {/* <span style={{color: '#144dff'}}>{parseInt(roundTimeLeft)}s</span> */}
                                <span style={{ fontSize: '0.7em', marginTop: '4px', opacity: '1', color: '#144dff' }}>round time left</span>
                                <div style={{ height: '18px' }}></div>
                                {/* {opponentProfile && (
                                    <div className="table-number">
                                        <h3>Go to table: {tableNumber}</h3>
                                    </div>
                                )} */}
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
                                    src="/assets/players_display_icon.png" 
                                    alt="Players in lobby" 
                                    className="player-count-img" 
                                    style={{ width: '40px', height: '40px', objectFit: 'contain' }}
                                />
                            </div>
                            <div className="player-count-text">
                                <span className="player-count-number">{player_count}</span>
                                <span className="player-count-label">
                                    {player_count === 1 ? '' : ''} in {lobbyCode} lobby
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
                                <>
                                    {Array.from({ length: Math.min(player_count, MAX_VISIBLE_PROFILES) }).map((_, index) => (
                                        <div 
                                            key={`profile-${index}`}
                                            className={`profile-icon-wrapper ${index === Math.min(player_count, MAX_VISIBLE_PROFILES) - 1 ? 'pop-in' : ''}`}
                                        >
                                            <img 
                                                src={index === 0 ? (userProfile?.image_data ? `data:image/jpeg;base64,${userProfile.image_data}` : "/assets/avatar_8.png") : "/assets/avatar_8.png"}
                                                alt={index === 0 ? "Your Profile" : `Profile ${index + 1}`}
                                                className="profile-icon"
                                                loading="lazy"
                                            />
                                            <div className="profile-icon-glow"></div>
                                        </div>
                                    ))}
                                    {player_count > MAX_VISIBLE_PROFILES && (
                                        <div className="profile-icon-wrapper more-profiles">
                                            <div className="more-profiles-bubble">
                                                +{player_count - MAX_VISIBLE_PROFILES}
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div>No profiles to display</div>
                            )}
                        </div>
                    </div>
                )}

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

                <button className="leave-lobby-button" onClick={leaveLobby}>Leave</button>
                <button className="how-to-tutorial-button" onClick={() => setShowTutorial(true)}>Tutorial</button>
                {permissions === "admin" && (
                    <button 
                        className="admin-view-button" 
                        onClick={() => navigate(`/admin_lobby_view?code=${lobbyCode}`)}
                    >
                        Manage
                    </button>
                )}

                {/* Only show tags section if there are custom tags available */}
                {Array.isArray(tagsState) && tagsState.length > 0 && (
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        if (selectionPhase === 'self') {
                            handleContinue();
                        } else {
                            handleSave();
                        }
                    }}>
                        <div className="tags-section" ref={tagsSectionRef}>
                            {/* Progress Bar */}
                            <div className="progress-bar-container">
                                <div 
                                    className={`progress-bar ${selectionPhase === 'desiring' ? 'progress-complete' : ''}`}
                                    onClick={handleBack}
                                />
                            </div>

                            {/* Tag Selection Groups */}
                            <div className={`tag-group ${selectionPhase === 'self' ? 'active' : 'hidden'}`}>
                                <div className="bounce-wrapper">
                                    <h2>Who are you?</h2>
                                </div>
                                <div className="tag-labels-container">
                                    {tagsState.map(tag => (
                                        <label key={`self-${tag}`} className="tag-label">
                                            <input
                                                type="checkbox"
                                                checked={(selfTags != null) ? selfTags.includes(tag) : serverselfTags.includes(tag)}
                                                onChange={() => handleTagChange('self', tag)}
                                            />
                                            {tag}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className={`tag-group ${selectionPhase === 'desiring' ? 'active' : 'hidden'}`} ref={desiringTagsRef}>
                                <div className="bounce-wrapper">
                                    <h2>Who do you want to meet?</h2>
                                </div>
                                <div className="tag-labels-container">
                                    {tagsState.map(tag => (
                                        <label key={`desiring-${tag}`} className="tag-label">
                                            <input
                                                type="checkbox"
                                                checked={(desiringTags != null) ? desiringTags.includes(tag) : serverdesiringTags.includes(tag)}
                                                onChange={() => handleTagChange('desiring', tag)}
                                            />
                                            {tag}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <button 
                                type="submit" 
                                className="tag-selection-button"
                                ref={continueButtonRef}
                            >
                                {selectionPhase === 'self' ? 'Continue' : 'Save'}
                            </button>
                            {tagLimitWarning && (
                                <div style={{
                                    color: '#144dff',
                                    textAlign: 'center',
                                    marginTop: '1rem',
                                    fontSize: '0.9rem',
                                    fontWeight: '600'
                                }}>
                                    {tagLimitWarning}
                                </div>
                            )}
                        </div>
                    </form>
                )}

                {/* <div className="bottom-buttons" style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '1rem',
                    marginTop: '1rem',
                    flexWrap: 'wrap',
                    padding: '0 1rem'
                }}>
                    <button className="secondary-button" onClick={loadSound}>
                        {soundEnabled ? 'Sound On' : 'Sound Off'}
                    </button>
                </div> */}
            </div>

            {(soundEnabled || !showSoundPrompt) || (lobbyState == "checkin") || (lobbyState == null) || isPlaying ? null : <SoundPrompt />}

            {/* Add the animation component */}
            {showLobbyCountdown && (
                <LobbyCountdown onComplete={handleLobbyCountdownComplete} />
            )}

            {/* Add the tutorial component */}
            {showTutorial && (
                <HowToTutorial onComplete={handleTutorialComplete} lobbyCode={lobbyCode} />
            )}

            {/* Add the animation component */}
            <ShowMatchAnimation 
                isVisible={showMatchAnimation} 
                onAnimationEnd={() => {
                    setShowMatchAnimation(false);
                    isAnimating.current = false;
                }} 
            />
        </div>
    );
}

export default LobbyScreen;
