//create a custom hook that takes arg setPlayerCount and calls the server with display_lobby_metadata and then sets the player count

import { useEffect } from 'react';

const fetchLobbyDataTime=5000;

const useGetLobbyMetadata = (setPlayerCount, setLobbyState) => {
  useEffect(() => {
    const fetchLobbyMetadata = async () => {
      const response = await fetch(`${server_url}/display_lobby_metadata`);
      const data = await response.json();
      setPlayerCount(data.player_count);
      setLobbyState(data.lobby_state);
    };

    fetchLobbyMetadata(); // Initial fetch
    
    const interval = setInterval(fetchLobbyMetadata, fetchLobbyDataTime); // Fetch every 5 second

    return () => clearInterval(interval); // Cleanup on unmount
  }, [setPlayerCount, setLobbyState]);

};

export default useGetLobbyMetadata;