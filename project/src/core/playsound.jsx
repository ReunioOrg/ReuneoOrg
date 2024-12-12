import { useRef, useState } from 'react';

function usePlaySound() {

    const ASSET_PATH="./assets";
    const AUDIO_FILE = "/sounds/audtest.mp3";
    const audioRef = useRef(new Audio(ASSET_PATH + AUDIO_FILE));
    const [audioLoaded, setAudioLoaded] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [error, setError] = useState(null);

    function loadSound() {
        setError(null);
        audioRef.current.load();
        audioRef.current.play().then(() => {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
          setAudioLoaded(true);
          setIsPlaying(true);
        }).catch(e => {
          console.error('Error loading audio:', e);
          setError('Failed to load audio. Please check the file path and format.');
        });
    };

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
    
    function seekTo(time) { 
        audioRef.current.currentTime = time;
    }


    return { audioRef, error , playSound, loadSound, seekTo};
}

export default usePlaySound;
