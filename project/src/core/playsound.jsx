import { useRef, useState } from 'react';

function usePlaySound() {

    const ASSET_PATH="./assets";
    // const AUDIO_FILE = "/sounds/audtest.mp3";
    const AUDIO_FILE = "/sounds/output.mp3";

    const audioRef = useRef(new Audio(ASSET_PATH + AUDIO_FILE));
    const [audioLoaded, setAudioLoaded] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [error, setError] = useState(null);
    const [soundEnabled, setSoundEnabled] = useState(false);

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


    return { audioRef, error , playSound, loadSound, seekTo, cancelSound, checkSound, soundEnabled, setSoundEnabled};
}

export default usePlaySound;
