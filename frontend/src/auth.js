import axios from 'axios';

let inactivityTimer;

export const isAuthenticated = () => {
  const token = localStorage.getItem('accessToken'); // Bruker accessToken for konsistens

  if (!token) return null;

  try {
    const payload = parseJwt(token);
    const currentTime = Date.now() / 1000; // Gjeldende tid i sekunder

    if (payload.exp > currentTime) {
      return payload; // Returnerer hele payload, inkludert rollen
    } else {
      localStorage.removeItem('accessToken');
      return null;
    }
  } catch (error) {
    console.error('Error parsing token:', error);
    localStorage.removeItem('accessToken');
    return null;
  }
};

// Kommenter ut eller fjern startInactivityTimer
/*
const startInactivityTimer = () => {
  clearTimeout(inactivityTimer);

  inactivityTimer = setTimeout(() => {
    refreshAuthToken(); // Forny token etter inaktivitet
  }, 14 * 60 * 1000); // Forny token 1 minutt før utløp
};
*/

// Kommenter ut eller fjern refreshAuthToken-funksjonen
/*
export const refreshAuthToken = async () => {
  try {
    console.log("Sending refresh token request...");
    const response = await axios.post('/api/refresh-token', {}, { withCredentials: true });

    if (response.data.accessToken) {
      console.log("Token refreshed successfully:", response.data.accessToken);
      localStorage.setItem('accessToken', response.data.accessToken);
      window.dispatchEvent(new Event('storage'));
      startInactivityTimer();
      return true;
    }
  } catch (error) {
    console.error('Failed to refresh token:', error.response || error.message);
    localStorage.removeItem('accessToken');
    return false;
  }
};
*/

const parseJwt = (token) => {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));

  return JSON.parse(jsonPayload);
};

// Fjern lyttere som kaller startInactivityTimer
/*
['mousemove', 'keydown', 'scroll', 'click'].forEach((event) => {
  window.addEventListener(event, startInactivityTimer);
});
*/
