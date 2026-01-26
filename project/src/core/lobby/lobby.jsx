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
import UserIsReadyAnimation from './user_is_ready_animation';
import { storeLobbyCode, clearLobbyStorage, refreshLobbyTimestamp } from '../utils/lobbyStorage';
import { CommunityPageButton } from '../community/mycf';
import LoadingSpinner from '../components/LoadingSpinner';
import { apiFetch } from '../utils/api';

const AVAILABLE_TAGS = []; // Remove hardcoded tags
const MAX_VISIBLE_PROFILES = 9; // Adjust this number to experiment with different limits
const MAX_TAGS_ALLOWED = 5; // Maximum number of tags allowed for both self and desiring tags
const useEffectTime=5000;
// Temporarily disable lobby profile image fetching to prevent backend overload
const DISABLE_LOBBY_PROFILE_IMAGES = false;

const LobbyScreen = () => {
    const playat=Math.floor(9*60);
    
    const [tagsState, setTagsState] = useState([]);
    const [selectionPhase, setSelectionPhase] = useState('self');
    const [hasScrolledToTags, setHasScrolledToTags] = useState(false);
    const [tagLimitWarning, setTagLimitWarning] = useState('');
    const desiringTagsRef = useRef(null);
    const continueButtonRef = useRef(null);
    const [showReadyAnimation, setShowReadyAnimation] = useState(false);
    const isReadyAnimating = useRef(false);
    const [tagsCompleted, setTagsCompleted] = useState(false);
    
    const { audioRef, error, playSound, loadSound, seekTo, cancelSound, checkSound, soundEnabled, setSoundEnabled, isPlaying } = usePlaySound();
    const [lobbyCode, setLobbyCode] = useState('yonder');
    const navigate = useNavigate();
    const { code } = useParams();
    const [player_count, setPlayerCount] = useState(null);
    useGetLobbyMetadata(setPlayerCount, null, lobbyCode);
    const { user, userProfile, checkAuth, permissions, isAuthLoading, authLoadingMessage } = useContext(AuthContext);

    // Add useEffect to check authentication and redirect if needed
    useEffect(() => {
        // Wait for auth loading to complete
        if (isAuthLoading) return;
        
        // If not authenticated, redirect to signup page
        if (!user) {
            const params = new URLSearchParams(window.location.search);
            const codeParam = params.get('code') || code;
            if (codeParam) {
                navigate(`/signup?redirect=lobby&code=${codeParam}`);
            } else {
                navigate('/signup?redirect=lobby');
            }
        }
    }, [isAuthLoading, user, navigate, code]);

    useEffect(() => {
        const checkParams = () => {
            const params = new URLSearchParams(window.location.search);
            const codeParam = params.get('code') || code;      
            if (codeParam) {
                setLobbyCode(codeParam);
                // Store lobby code in localStorage for "return to lobby" feature
                storeLobbyCode(codeParam);

                // Fetch sponsor logo data for this lobby
                fetchLobbySetupData(codeParam);

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
    const beatGoOff = useRef(null);
    const [lobbyState, setLobbyState] = useState(null);
    const [roundTimeLeft, setRoundTimeLeft] = useState(null);
    const [roundDisplayTime, setRoundDisplayTime] = useState(null);
    const [roundDuration, setRoundDuration] = useState(null);
    const [showSoundPrompt, setShowSoundPrompt] = useState(true);

    // const playat=220;
    const isFetchingCounter=useRef(0);

    const [selfTags, setSelfTags] = useState(null);
    const [desiringTags, setDesiringTags] = useState(null);

    const [serverselfTags, setServerselfTags] = useState([]);
    const [serverdesiringTags, setServerdesiringTags] = useState([]);

    // Add this new state to track page visibility
    const [isPageVisible, setIsPageVisible] = useState(!document.hidden);

    // Add this ref near your other state declarations
    const lobbyCodeRef = useRef('yonder');

    // Profile images cache and state management
    const profileImagesCache = useRef({});
    const currentUsernamesRef = useRef([]);
    const [isLoadingProfiles, setIsLoadingProfiles] = useState(false);

    // Sponsor logo management
    const logoDataRef = useRef(null);
    const [logoLoaded, setLogoLoaded] = useState(false);

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
        const response = await apiFetch('/player_info');
        const data = await response.json();
        console.log("PLAYER INFO:", data);
    }

    async function define_profile_info(self_tags, desiring_tags){
        const response = await apiFetch('/set_profile_info', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                tags_work: self_tags,
                tags_desiring_work: desiring_tags
            })
        });

        const data = await response.json();
        console.log("SET PROFILE INFO:", data);
    }

    const fetchProfileImages = async (usernamesToFetch) => {
        if (usernamesToFetch.length === 0) return;
        
        setIsLoadingProfiles(true);
        try {
            const response = await apiFetch('/load_batch_pfp_small_icons', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'lobby_code': lobbyCodeRef.current
                },
                body: JSON.stringify({ usernames: usernamesToFetch })
            });
            
            if (response.ok) {
                const imageData = await response.json();
                // Merge new images into existing cache
                profileImagesCache.current = {
                    ...profileImagesCache.current,
                    ...imageData
                };
                console.log("Profile images fetched:", Object.keys(imageData));
            } else {
                console.error("Failed to fetch profile images:", response.status);
            }
        } catch (error) {
            console.error("Error fetching profile images:", error);
            // Silent fail - just use default avatars
        } finally {
            setIsLoadingProfiles(false);
        }
    };

    const fetchLobbySetupData = async (currentLobbyCode) => {
        try {
            const response = await apiFetch('/lobby_setup_data', {
                headers: {
                    'lobby_code': currentLobbyCode
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.logo_icon) {
                    logoDataRef.current = data.logo_icon;
                    setLogoLoaded(true);
                    console.log("Sponsor logo loaded successfully");
                } else {
                    console.log("No sponsor logo available for this lobby");
                }
            } else {
                console.error("Failed to fetch lobby setup data:", response.status);
            }
        } catch (error) {
            console.error("Error fetching lobby setup data:", error);
        }
    };


    async function leaveLobby(){
        try {
            cancelSound();
            
            // Clear profile images cache
            profileImagesCache.current = {};
            currentUsernamesRef.current = [];
            
            const response = await apiFetch('/disconnect_lobby', {
                headers: {
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

    // Match banner state
    const [showMatchBanner, setShowMatchBanner] = useState(false);
    const [matchingTags, setMatchingTags] = useState(null);

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

    // New function to get the specific matching tags
    const getMatchingTags = (playerTags, opponentTags) => {
        if (!playerTags || !opponentTags) return null;
        
        // Find first bidirectional match
        for (const playerTag of playerTags.tags_work) {
            if (opponentTags.desiring_tags_work.includes(playerTag)) {
                // Found player's tag that opponent wants, now check reverse
                for (const opponentTag of opponentTags.tags_work) {
                    if (playerTags.desiring_tags_work.includes(opponentTag)) {
                        return { playerTag, opponentTag };
                    }
                }
            }
        }
        return null;
    };

    // Modify the fetchLobbyData function to include match detection
    async function fetchLobbyData(){
        try {
            isFetchingCounter.current+=1;
            if (isFetchingCounter.current>5) {
                isFetchingCounter.current=0;
                isFetchingProfile.current=false;
            }
            const isTabVisible = !document.hidden;
            // Use the ref value instead of the state directly
            const currentLobbyCode = lobbyCodeRef.current;
            console.log("lobby code fr:", currentLobbyCode);
            if (currentLobbyCode=="yonder") {
                console.log("lobby code is not set");
                return;
            }

            // First fetch lobby data
            const response = await apiFetch(`/lobby?is_visible=${isTabVisible}`, {
                headers: {
                    'is_visible_t_f': (isTabVisible)?"t":"f",
                    'lobby_code': currentLobbyCode
                }
            });
            
            if (response.ok) {                    
                const data = await response.json();
                console.log("LOBBY PAIR DATA:",currentLobbyCode, data);
                if (data.status=="inactive"){
                    cancelSound();
                    navigate('/post-event-auth');
                    return;  // Exit early, don't continue processing
                }
                
                // Refresh lobby timestamp to prevent 30-minute expiry during active session
                if (data.lobby_state !== "terminated") {
                    refreshLobbyTimestamp();
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
                beatGoOff.current = data.beat_go_off;
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
                const metadataResponse = await apiFetch(`/display_lobby_metadata?lobby_code=${currentLobbyCode}`, {
                    headers: {
                        'lobby_code': currentLobbyCode
                    }
                });
                
                if (metadataResponse.ok) {
                    const metadataData = await metadataResponse.json();
                    setPlayerCount(metadataData.player_count);
                    
                    // Check if usernames changed and fetch missing profile images
                    const newUsernames = metadataData.usernames || [];
                    const usernamesChanged = JSON.stringify(currentUsernamesRef.current) !== JSON.stringify(newUsernames);
                    
                    if (usernamesChanged) {
                        currentUsernamesRef.current = newUsernames;
                        
                        // Find usernames we don't have cached images for
                        const newUsernamesToFetch = newUsernames.filter(username => 
                            !profileImagesCache.current[username] && 
                            username !== user?.username // Don't fetch current user's image
                        );
                        
                        if (newUsernamesToFetch.length > 0) {
                            if (DISABLE_LOBBY_PROFILE_IMAGES) {
                                console.log("Profile image fetching disabled for lobby display");
                                console.log(`Skipping profile image fetch for ${newUsernamesToFetch.length} users - lobby images disabled`);
                            } else {
                                console.log("Fetching images for new users:", newUsernamesToFetch);
                                fetchProfileImages(newUsernamesToFetch);
                            }
                        }
                    }
                }

                if ((opponentName!=data.opponent_name) || (opponentProfile==null)) {
                    if ((!isFetchingProfile.current) && (data.opponent_name!=null)) {
                        isFetchingProfile.current=true;
                        console.log("fetching profile");
                        const profile_response = await apiFetch('/paired_player_profile');
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
                    const matchDetails = getMatchingTags(data.player_tags, data.opponent_tags);
                    if (matchDetails) {
                        console.log('Match found! Setting animation and banner...', matchDetails);
                        setMatchingTags(matchDetails);
                        setShowMatchBanner(true);
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
                backgroundColor: 'rgba(0, 0, 0, 0.125)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 1100
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
            // Delay optimistic UI update until after scroll completes
            setTimeout(() => {
                setServerselfTags(selfTags || []);
            }, 800); // Delay to allow scroll animation to complete
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
            // Delay optimistic UI update until after scroll completes
            setTimeout(() => {
                setServerselfTags(selfTags || []);
                setServerdesiringTags(desiringTags);
            }, 800); // Delay to allow scroll animation to complete
            setTimeout(() => {
                if (!isReadyAnimating.current) {
                    isReadyAnimating.current = true;
                    setShowReadyAnimation(true);
                    setTagsCompleted(true);
                }
            }, 500);
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

    // Reset match banner when lobby state changes or opponent leaves
    useEffect(() => {
        if (lobbyState !== "active" || !opponentProfile) {
            setShowMatchBanner(false);
            setMatchingTags(null);
        }
    }, [lobbyState, opponentProfile]);

    // Clear profile images cache when lobby terminates
    useEffect(() => {
        if (lobbyState === "terminated") {
            profileImagesCache.current = {};
            currentUsernamesRef.current = [];
            // Clear lobby from localStorage since it's terminated
            clearLobbyStorage();
        }
    }, [lobbyState]);

    const tagsSectionRef = useRef(null);

    // Add useEffect to scroll to tags if no server tags exist and custom tags are available
    useEffect(() => {
        if (!hasScrolledToTags && !serverselfTags?.length && !serverdesiringTags?.length && tagsState?.length > 0) {
            tagsSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
            setHasScrolledToTags(true);
        }
    }, [serverselfTags, serverdesiringTags, tagsState, hasScrolledToTags]);

    // Show fullscreen spinner while checking auth
    if (isAuthLoading) {
        return <LoadingSpinner fullScreen message={authLoadingMessage} />;
    }

    return (
        <div className="lobby-container">
            {/* <CommunityPageButton /> */}
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
                {/* <p style={{color: '#144dff', fontSize: '0.8rem', fontWeight: '600', textAlign: 'center', marginTop: '0.5rem'}}>
                    TimeToSkip: {roundPosition.current}
                    <br />
                    Lenth of Audio File: {audioRef.current.duration}
                    <br />
                    {roundPosition.current && (
                        <>
                            Time to Play: {new Date(Date.now() - roundPosition.current).toLocaleTimeString([], {hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3})}
                            <br />
                            Time to Skip: {beatGoOff.current}
                            {beatGoOff.current && (() => {
                                const beatGoOffTime = new Date(beatGoOff.current);
                                const timeDiff = beatGoOffTime.getTime() - Date.now();
                                const absTimeDiff = Math.abs(timeDiff);
                                const hours = Math.floor(absTimeDiff / (1000 * 60 * 60));
                                const minutes = Math.floor((absTimeDiff % (1000 * 60 * 60)) / (1000 * 60));
                                const seconds = Math.floor((absTimeDiff % (1000 * 60)) / 1000);
                                const ms = absTimeDiff % 1000;
                                
                                return (
                                    <span>
                                        <br />
                                        Time to Skip: {timeDiff < 0 ? '-' : ''}
                                        {hours.toString().padStart(2, '0')}:
                                        {minutes.toString().padStart(2, '0')}:
                                        {seconds.toString().padStart(2, '0')}.
                                        {ms.toString().padStart(3, '0')}
                                    </span>
                                );
                            })()}
                        </>
                    )}
                </p> */}

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
                        {tagsState.length > 0 && (serverselfTags.length == 0 || serverdesiringTags.length == 0) ? (
                            <>
                                You're not ready, complete your profile to get matched up.
                                <button 
                                    className="missing-tags-button"
                                    onClick={() => tagsSectionRef.current?.scrollIntoView({ behavior: 'smooth' })}
                                >
                                    Complete Profile
                                </button>
                            </>
                        ) : lobbyState === "active" && opponentProfile ? (
                            <span className="lobby-pop-burst">
                                Go find {opponentProfile.name}!
                            </span>
                        ) : lobbyState === "checkin" ? (
                            <>
                                Wait here {userProfile?.name?.slice(0, 15) || user || 'Guest'}.
                                <br />
                                Your host will start the experience.
                            </>
                        ) : lobbyState === "active" && !opponentProfile ? (
                            "You will be paired with someone in the next round."
                        ) : lobbyState === "interrim" ? (
                            "Get ready for the next round!"
                        ) : lobbyState === "terminated" ? (
                            "This session has ended. Thank you for participating!"
                        ) : lobbyState === null ? (
                            "Connecting to lobby..."
                        ) : (
                            ""
                        )}
                    </h2>
                </div>

                {/* Table number display - moved here to be right below the header */}
                {lobbyState === "active" && opponentProfile && tableNumber && (
                    <div className="table-number">
                        <h3>at table: {tableNumber}</h3>
                    </div>
                )}

                {/* Timer and Sponsor Container - Conditional visibility */}
                {(logoDataRef.current || lobbyState !== "checkin") && (
                    <div className={`timer-sponsor-container ${(logoDataRef.current && lobbyState !== "checkin") ? "has-timer" : ""}`}>
                    {/* Sponsor Logo - Conditional visibility */}
                    {logoDataRef.current && (
                        <div className="sponsor-logo">
                            <img 
                                src={`data:image/jpeg;base64,${logoDataRef.current}`}
                                alt="Sponsor Logo"
                                style={{
                                    width: '100px',
                                    height: '100px',
                                    objectFit: 'contain'
                                }}
                            />
                        </div>
                    )}

                    {/* Timer - Only visible when not in checkin state */}
                    {lobbyState !== "checkin" && (
                        <div className="time-left" style={{display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'white'}}>
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
                                    <span style={{ fontWeight: 700, fontSize: '0.7em', marginTop: '4px', opacity: '1', color: '#144dff', textShadow: '1px 1px 2px rgba(0, 0, 0, 0.1)' }}>round time left</span>
                                </>
                            ) : (
                                <span className="time-left-text"></span>
                            )}
                        </div>
                    )}
                </div>
                )}

                {/* Match Banner */}
                {showMatchBanner && matchingTags && lobbyState === "active" && opponentProfile && (
                    <div className="match-banner">
                        <span className="match-tag">{matchingTags.playerTag}</span>
                        <div className="match-arrow"></div>
                        <span className="match-tag">{matchingTags.opponentTag}</span>
                    </div>
                )}

                <div style={{display: 'flex', justifyContent: 'center', width: '100%', margin: '0 auto'}}>
                    {(lobbyState === "active" || lobbyState === "interrim") ? (
                        opponentProfile ? (
                            <div style={{marginTop: '-3rem', width: '100%', display: 'flex', justifyContent: 'center'}}>
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
                        <div className="player-count-widget">
                            <div className="player-count-icon">
                                <div className="icon-pulse"></div>
                                <img 
                                    src="/assets/players_display_icon2.png" 
                                    alt="Players in lobby" 
                                    className="player-count-img" 
                                />
                            </div>
                            <div className="player-count-info">
                                <span className="player-count-number">{player_count}</span>
                                <span className="player-count-label">joined</span>
                            </div>
                            <div className="player-count-lobby">{lobbyCode}</div>
                        </div>
                    </div>
                )}

                {/* Profile Images to Display in Lobby*/}
                {((lobbyState === "checkin") || (lobbyState === "active" && !opponentProfile)) && (
                    <div className="lobby-profiles-container">
                        <div className="lobby-profiles-grid">
                            {player_count > 0 ? (
                                <>
                                    {Array.from({ length: Math.min(player_count, MAX_VISIBLE_PROFILES) }).map((_, index) => {
                                        let profileImageSrc;
                                        
                                        // Use cached images for all users including current user
                                        if (DISABLE_LOBBY_PROFILE_IMAGES) {
                                            profileImageSrc = "/assets/avatar_8.png";
                                        } else {
                                            const availableUsernames = currentUsernamesRef.current;
                                            const usernameForThisSlot = availableUsernames[index];
                                            
                                            if (usernameForThisSlot && profileImagesCache.current[usernameForThisSlot]) {
                                                profileImageSrc = `data:image/jpeg;base64,${profileImagesCache.current[usernameForThisSlot]}`;
                                            } else {
                                                profileImageSrc = "/assets/avatar_8.png";
                                            }
                                        }
                                        
                                        return (
                                            <div 
                                                key={`profile-${index}`}
                                                className={`profile-icon-wrapper ${index === Math.min(player_count, MAX_VISIBLE_PROFILES) - 1 ? 'pop-in' : ''}`}
                                            >
                                                <img 
                                                    src={profileImageSrc}
                                                    alt={`Profile ${index + 1}`}
                                                    className="profile-icon"
                                                    loading="lazy"
                                                />
                                                <div className="profile-icon-glow"></div>
                                            </div>
                                        );
                                    })}
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
                        {(serverselfTags && serverselfTags.length > 0) && (
                            <div className="tag-category">
                                <h4>I am:</h4>
                                <div className="tag-list">
                                    {serverselfTags.map(tag => (
                                        <span key={`self-${tag}`} className="tag-item">{tag}</span>
                                    ))}
                                </div>
                            </div>
                        )}
                        {(serverdesiringTags && serverdesiringTags.length > 0) && (
                            <div className="tag-category">
                                <h4>Looking for:</h4>
                                <div className="tag-list">
                                    {serverdesiringTags.map(tag => (
                                        <span key={`desiring-${tag}`} className="tag-item">{tag}</span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <button className="leave-lobby-button" onClick={leaveLobby}>Take Break</button>
                <button className="how-to-tutorial-button" onClick={() => setShowTutorial(true)}>Tutorial</button>
                {(permissions === "admin" || permissions === "organizer") && (
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
                            {/* Progress Bar Tabs */}
                            <div className="progress-bar-container">
                                <div 
                                    className={`self-progress-bar-tab ${selectionPhase === 'self' ? 'active' : ''} ${serverselfTags.length > 0 ? 'complete' : ''}`}
                                    onClick={() => setSelectionPhase('self')}
                                >
                                    👤 Who are you?
                                </div>
                                <div 
                                    className={`desiring-progress-bar-tab ${selectionPhase === 'desiring' ? 'active' : ''} ${serverdesiringTags.length > 0 ? 'complete' : ''}`}
                                    onClick={() => serverselfTags.length > 0 ? setSelectionPhase('desiring') : null}
                                >
                                    👤 Who do you want to meet?
                                </div>
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
            {showLobbyCountdown && !(tagsState.length > 0 && serverdesiringTags.length === 0) && (
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

            {/* Add the ready animation component */}
            <UserIsReadyAnimation 
                isVisible={showReadyAnimation} 
                onAnimationEnd={() => {
                    setShowReadyAnimation(false);
                    isReadyAnimating.current = false;
                }} 
            />
        </div>
    );
}

export default LobbyScreen;
