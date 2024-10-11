import { useState, useEffect } from 'react';
import jwt_decode from 'jwt-decode'; // Ensure this is correctly imported
import process from 'process'; // Import process

const UseAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('accessToken'); // Bruker 'accessToken' for konsistens
    console.log('Token from local storage:', token);

    if (token) {
      try {
        const decodedToken = jwt_decode(token);
        const currentTime = Date.now() / 1000;

        if (decodedToken.exp > currentTime) {
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem('token');
        }
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    }
  }, []);

  return isAuthenticated;
};

export default UseAuth;
