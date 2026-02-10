import { useRef, useState, useEffect  } from 'react';
import { useNavigate } from 'react-router-dom';
function usePlaySound() {

    const ASSET_PATH="./assets";
    const MAIN_AUDIO_FILE = "/sounds/new_elevator_combined.mp3";
    const AMBIENT_AUDIO_FILE = "/sounds/ambient_loop.mp3";
    const navigate = useNavigate();

    const audioRef = useRef(new Audio(ASSET_PATH + MAIN_AUDIO_FILE));
    const ambientRef = useRef(new Audio(ASSET_PATH + AMBIENT_AUDIO_FILE));
    const modeRef = useRef('idle'); // 'idle', 'ambient', 'main'

    const [audioLoaded, setAudioLoaded] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [error, setError] = useState(null);
    const [soundEnabled, setSoundEnabled] = useState(false);
    const [loop, setLoop] = useState(false);


    useEffect(() => {
        const audio = audioRef.current;
        const handleEnded = () => {
            audio.pause();
            audio.currentTime = 0;
            setIsPlaying(false);
            cancelSound();
            //navigate('/');
        };
    
        audio.addEventListener("ended", handleEnded);
        return () => audio.removeEventListener("ended", handleEnded);
    }, [loop]);

    // Load and play main track directly (used by admin view, and fallback re-enable)
    function loadSound() {
        setError(null);
        modeRef.current = 'main';
        // Stop ambient if it was playing
        if (ambientRef.current && !ambientRef.current.paused) {
            ambientRef.current.pause();
            ambientRef.current.currentTime = 0;
        }
        audioRef.current.load();
        audioRef.current.play().then(() => {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
          setAudioLoaded(true);
          setIsPlaying(true);
          setSoundEnabled(true);
          playSound();
        }).catch(e => {
          console.error('Error loading audio:', e);
          setError('Failed to load audio. Please check the file path and format.');
          setSoundEnabled(false);
        });
    };

    // Start ambient loop for checkin state, and pre-unlock main track for later switchover
    function loadAmbientSound() {
        setError(null);
        modeRef.current = 'ambient';

        // Pre-unlock and preload main track (brief play+pause within user gesture)
        // This maximizes switchover success rate when transitioning out of checkin
        audioRef.current.load();
        audioRef.current.play().then(() => {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            console.log('Main track pre-unlocked for later switchover');
        }).catch(e => {
            console.error('Error pre-loading main audio:', e);
            // Non-fatal: ambient will still work, switchover may need fallback prompt
        });

        // Start ambient loop (safe to play indefinitely — no jingle in this file)
        ambientRef.current.loop = true;
        ambientRef.current.load();
        ambientRef.current.play().then(() => {
            setAudioLoaded(true);
            setIsPlaying(true);
            setSoundEnabled(true);
        }).catch(e => {
            console.error('Error loading ambient audio:', e);
            setError('Failed to load audio. Please check the file path and format.');
            setSoundEnabled(false);
        });
    };

    // Switch from ambient loop to main track at a specific position (e.g. jingle at 540s)
    // Returns a promise so the caller can handle failure (show fallback sound prompt)
    function switchToMainTrack(seekPosition) {
        // Stop ambient if playing
        if (ambientRef.current && !ambientRef.current.paused) {
            ambientRef.current.pause();
            ambientRef.current.currentTime = 0;
        }
        modeRef.current = 'main';

        if (audioRef.current) {
            audioRef.current.currentTime = seekPosition;
            if (audioRef.current.paused) {
                return audioRef.current.play().then(() => {
                    setIsPlaying(true);
                    setSoundEnabled(true);
                }).catch(e => {
                    console.error('Switchover to main track failed:', e);
                    setIsPlaying(false);
                    setSoundEnabled(false);
                    throw e; // re-throw so caller can show fallback prompt
                });
            }
            // Already playing (e.g. already in main mode), just sought to position
            return Promise.resolve();
        }
        // audioRef was nulled (cancelSound was called earlier)
        setIsPlaying(false);
        setSoundEnabled(false);
        return Promise.reject(new Error('No audio ref available'));
    }

    function checkSound(){
        // Check whichever audio is currently active based on mode
        if (modeRef.current === 'ambient' && ambientRef.current) {
            return !ambientRef.current.paused;
        }
        if (audioRef.current) {
            if (!audioRef.current.paused) {
                return true;
            }
        }
        return false;
    }

    function playSound() {
        if (audioRef.current && audioRef.current.paused) {
            audioRef.current.play().catch(e => {
            console.error('Error playing audio:', e);
            setError('Failed to play audio. Please try again.');
            });
        } else if (audioRef.current) {
            audioRef.current.currentTime = 0;
        }
    }

    function cancelSound() {
        // Cancel ambient audio
        if (ambientRef.current) {
            ambientRef.current.pause();
            ambientRef.current.currentTime = 0;
            ambientRef.current.src = '';
            ambientRef.current = null;
        }
        // Cancel main audio
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            audioRef.current.src = '';
            audioRef.current = null;
        }
        modeRef.current = 'idle';
    }
    
    function seekTo(time) { 
        if (audioRef.current) {
            audioRef.current.currentTime = time;
            // console log the length of the audio file
            console.log(audioRef.current.duration);
        }
    }


    return { audioRef, error , playSound, loadSound, loadAmbientSound, switchToMainTrack, seekTo, cancelSound, checkSound, soundEnabled, setSoundEnabled, isPlaying };
}

export default usePlaySound;
