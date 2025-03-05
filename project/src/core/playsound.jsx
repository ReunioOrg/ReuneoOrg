import { useRef, useState, useEffect  } from 'react';
import { useNavigate } from 'react-router-dom';
function usePlaySound() {

    const ASSET_PATH="./assets";
    const AUDIO_FILE = "/sounds/banger.mp3";
    const navigate = useNavigate();

    const audioRef = useRef(new Audio(ASSET_PATH + AUDIO_FILE));
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
            navigate('/');
        //     console.log("Audio ended. Checking if user has been inactive for too long.");
        //   // Check if user has been inactive for too long
        //   if (lastActiveTimestamp && (Date.now() - lastActiveTimestamp > inactivityThreshold)) {
        //     console.log("User has been inactive for too long. Pausing audio.");
        //     audio.pause();
        //     audio.currentTime = 0;
        //     setIsPlaying(false);
        //     cancelSound();
        //     navigate('/');

        //     // The navigation will be handled in the component using this hook
        //   } else if (!loop) {
        //     audio.pause();
        //     audio.currentTime = 0;
        //   } else {
        //     audio.play(); // Loop manually if needed
        //   }
        };
    
        audio.addEventListener("ended", handleEnded);
        return () => audio.removeEventListener("ended", handleEnded);
    }, [loop]);

    // useEffect(() => {
    //     if (checkSound()) {
            
    //     }
    // }, []);

    function loadSound() {
        setError(null);
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

    function checkSound(){
        if (audioRef.current) {
            if (!audioRef.current.paused) {
                return true;
            }
        }
        return false;
    }

    function playSound() {
        if (audioRef.current.paused) {
            audioRef.current.play().catch(e => {
            console.error('Error playing audio:', e);
            setError('Failed to play audio. Please try again.');
            });
        } else {
            audioRef.current.currentTime = 0;
        }
    }

    function cancelSound() {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            audioRef.current.src = '';
            audioRef.current = null;
        }
    }
    
    function seekTo(time) { 
        audioRef.current.currentTime = time;
    }


    return { audioRef, error , playSound, loadSound, seekTo, cancelSound, checkSound, soundEnabled, setSoundEnabled, isPlaying };
}

export default usePlaySound;
