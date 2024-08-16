// src/auth.js
import axios from 'axios';

let inactivityTimer;

export const isAuthenticated = () => {
  const token = localStorage.getItem('token');

  if (!token) return false;

  try {
    const payload = parseJwt(token);
    const currentTime = Date.now() / 1000; // Gjeldende tid i sekunder

    if (payload.exp > currentTime) {
      startInactivityTimer();
      return true;
    } else {
      localStorage.removeItem('token');
      return false;
    }
  } catch (error) {
    console.error('Error parsing token:', error);
    localStorage.removeItem('token');
    return false;
  }
};

const startInactivityTimer = () => {
  clearTimeout(inactivityTimer);

  inactivityTimer = setTimeout(() => {
    refreshAuthToken(); // Forny token etter inaktivitet
  }, 14 * 60 * 1000); // Forny token 1 minutt før utløp (hvis tokenet er 15 minutter langt)
};

const refreshAuthToken = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return;

    const response = await axios.post('/api/refresh-token', {}, {
      headers: { Authorization: `Bearer ${token}` }
    });

    localStorage.setItem('token', response.data.accessToken);
    startInactivityTimer(); // Reset timer
  } catch (error) {
    console.error('Failed to refresh token:', error);
    localStorage.removeItem('token');
  }
};

const parseJwt = (token) => {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));

  return JSON.parse(jsonPayload);
};

// Lytt til aktivitet på siden
window.addEventListener('mousemove', startInactivityTimer);
window.addEventListener('keydown', startInactivityTimer);
window.addEventListener('scroll', startInactivityTimer);
window.addEventListener('click', startInactivityTimer);
