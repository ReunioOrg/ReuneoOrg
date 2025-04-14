//create a custom hook that takes arg setPlayerCount and calls the server with display_lobby_metadata and then sets the player count

import { useEffect } from 'react';

const fetchLobbyDataTime=5000;

const useGetLobbyMetadata = (setPlayerCount, setLobbyState = null, lobbyCode = null) => {
  useEffect(() => {
    const fetchLobbyMetadata = async () => {
      try {
        // Include lobby code in the request if provided
        const url = lobbyCode 
          ? `${window.server_url}/display_lobby_metadata?lobby_code=${lobbyCode}`
          : `${window.server_url}/display_lobby_metadata`;
          
        const token = localStorage.getItem('access_token');
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'lobby_code': lobbyCode
          }
        });

        if (!response.ok) {
          console.error("Failed to fetch lobby metadata");
          return;
        }
        
        const data = await response.json();
        setPlayerCount(data.player_count);
        // console.log(data);
        // Only call setLobbyState if it was provided
        if (setLobbyState) {
          setLobbyState(data.lobby_state);
        }
      } catch (error) {
        console.error("Error fetching lobby metadata:", error);
      }
    };

    fetchLobbyMetadata(); // Initial fetch
    
    const interval = setInterval(fetchLobbyMetadata, fetchLobbyDataTime); // Fetch every 5 second

    return () => clearInterval(interval); // Cleanup on unmount
  }, [setPlayerCount, setLobbyState, lobbyCode]);

};

export default useGetLobbyMetadata;