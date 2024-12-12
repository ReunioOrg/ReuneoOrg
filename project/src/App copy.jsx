// const asset_path="project/dist/assets/";
import React, { useState, useRef, useEffect } from 'react';

// const ASSET_PATH="./project/dist/assets";
const ASSET_PATH="./assets";
const AUDIO_FILE = "/sounds/audtest.mp3";

const App = () => {
  const [audioLoaded, setAudioLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(new Audio(ASSET_PATH + AUDIO_FILE));
  const intervalRef = useRef(null);
  const [selectedImage, setSelectedImage] = useState(null);

  const loadSound = () => {
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

  const playSound = () => {
    if (audioRef.current.paused) {
      audioRef.current.play().catch(e => {
        console.error('Error playing audio:', e);
        setError('Failed to play audio. Please try again.');
      });
    } else {
      audioRef.current.currentTime = 0;
    }
  };

  useEffect(() => {
    if (isPlaying) {
      playSound();
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  // useEffect(() => {
  //   if (isPlaying && audioLoaded) {
  //     intervalRef.current = setInterval(playSound, 30000);
  //   }
  //   return () => {
  //     if (intervalRef.current) {
  //       clearInterval(intervalRef.current);
  //     }
  //   };
  // }, [isPlaying, audioLoaded]);

  const togglePlayback = () => {
    setIsPlaying(prev => !prev);
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedImage(URL.createObjectURL(file));
    }
  };

  return (
    <div>
      <button onClick={togglePlayback}>{isPlaying ? 'Stop Playback' : 'Start Playback'}</button>
      
      {/* Add image upload section */}
      <div style={{ marginTop: '20px' }}>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
        />
        {selectedImage && (
          <div style={{ marginTop: '10px' }}>
            <img 
              src={selectedImage} 
              alt="Uploaded preview" 
              style={{ maxWidth: '300px' }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default App;