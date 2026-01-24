/**
 * Authenticated fetch wrapper
 * 
 * Always includes:
 * - credentials: 'include' (for session cookies)
 * - Authorization header with JWT if available (backwards compatibility)
 * 
 * Usage:
 *   import { apiFetch } from '../utils/api';
 *   
 *   // GET request
 *   const response = await apiFetch('/endpoint');
 *   
 *   // POST request with JSON body
 *   const response = await apiFetch('/endpoint', {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify({ data: 'value' })
 *   });
 */

export async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem('access_token');
  
  const config = {
    ...options,
    credentials: 'include', // Always send session cookies
    headers: {
      // Add JWT token if available (for backwards compatibility)
      ...(token && { 'Authorization': `Bearer ${token}` }),
      // Caller's headers can override the above
      ...options.headers,
    },
  };
  
  return fetch(`${window.server_url}${endpoint}`, config);
}

export default apiFetch;
