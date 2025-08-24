// Utility functions for managing current lobby in localStorage

const LOBBY_CODE_KEY = 'currentLobbyCode';
const LOBBY_TIMESTAMP_KEY = 'currentLobbyTimestamp';
const LOBBY_LAST_VALIDATED_KEY = 'currentLobbyLastValidated';

// Expiry times
const LOBBY_EXPIRY_TIME = 30 * 60 * 1000; // 30 minutes
const VALIDATION_CACHE_TIME = 3 * 60 * 1000; // 3 minutes

/**
 * Store lobby code with current timestamp
 */
export const storeLobbyCode = (lobbyCode) => {
  localStorage.setItem(LOBBY_CODE_KEY, lobbyCode);
  localStorage.setItem(LOBBY_TIMESTAMP_KEY, Date.now().toString());
  console.log(`Stored lobby code: ${lobbyCode}`);
};

/**
 * Get stored lobby code if not expired
 */
export const getStoredLobbyCode = () => {
  const lobbyCode = localStorage.getItem(LOBBY_CODE_KEY);
  const timestamp = localStorage.getItem(LOBBY_TIMESTAMP_KEY);
  
  if (!lobbyCode || !timestamp) {
    return null;
  }
  
  // Check if expired (30 minutes)
  const timeSinceStored = Date.now() - parseInt(timestamp);
  if (timeSinceStored > LOBBY_EXPIRY_TIME) {
    clearLobbyStorage();
    console.log('Lobby code expired, cleared from storage');
    return null;
  }
  
  return lobbyCode;
};

/**
 * Check if we need to validate lobby with server (cache check)
 */
export const shouldValidateLobby = () => {
  const lastValidated = localStorage.getItem(LOBBY_LAST_VALIDATED_KEY);
  
  if (!lastValidated) {
    return true;
  }
  
  const timeSinceValidation = Date.now() - parseInt(lastValidated);
  return timeSinceValidation > VALIDATION_CACHE_TIME;
};

/**
 * Mark lobby as validated (update cache timestamp)
 */
export const markLobbyValidated = () => {
  localStorage.setItem(LOBBY_LAST_VALIDATED_KEY, Date.now().toString());
};

/**
 * Clear all lobby-related localStorage
 */
export const clearLobbyStorage = () => {
  localStorage.removeItem(LOBBY_CODE_KEY);
  localStorage.removeItem(LOBBY_TIMESTAMP_KEY);
  localStorage.removeItem(LOBBY_LAST_VALIDATED_KEY);
  console.log('Cleared lobby storage');
};

/**
 * Update lobby timestamp (refresh the 30-minute timer)
 */
export const refreshLobbyTimestamp = () => {
  const lobbyCode = localStorage.getItem(LOBBY_CODE_KEY);
  if (lobbyCode) {
    localStorage.setItem(LOBBY_TIMESTAMP_KEY, Date.now().toString());
  }
};
