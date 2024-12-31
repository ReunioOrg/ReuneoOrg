//create a custom hook that takes arg setPlayerCount and calls the server with display_lobby_metadata and then sets the player count

import { useEffect } from 'react';

const useGetLobbyMetadata = (setPlayerCount) => {
  useEffect(() => {
    const fetchLobbyMetadata = async () => {
      const response = await fetch(`${server_url}/display_lobby_metadata`);
      const data = await response.json();
      setPlayerCount(data.player_count);
    };
    fetchLobbyMetadata();
  }, [setPlayerCount]);
};

export default useGetLobbyMetadata;