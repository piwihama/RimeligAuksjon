import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import './MyAuctions.css'; // Import the CSS file for styling


const MyAuctions = () => {
  const [auctions, setAuctions] = useState([]);
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/minside'); // Navigate back to the previous page
  };

  useEffect(() => {
    const fetchAuctions = async (page = 1) => {
      try {
        const token = localStorage.getItem('token'); // Get the token from localStorage
        const response = await axios.get(`https://rimelig-auksjon-backend.vercel.app/api/myauctions?page=${page}&limit=10`, {
          headers: {
            'Authorization': `Bearer ${token}` // Include the token in the headers
          }
        });
        setAuctions(response.data);
      } catch (error) {
        console.error('Error fetching auctions:', error);
      }
    };
  
    fetchAuctions();
  }, []);
  

  return (
    <div className="my-auctions-container">
          <div className="back-butto">
        <button onClick={handleBack}>Tilbake</button>
      </div>
      <h1>Mine Auksjoner</h1>
      
      {auctions.length > 0 ? (
        <div className="auctions-grid">
          {auctions.map(auction => (
            <div className="auction-card" key={auction._id}>
              <h6>{auction.title}</h6>
              {auction.images && auction.images.length > 0 && (
                <img src={auction.images[0]} alt={auction.title} className="auction-image" />
              )}
              <div className="auction-details">
                <p><strong>Merke:</strong> {auction.brand}</p>
                <p><strong>Modell:</strong> {auction.model}</p>
                <p><strong>År:</strong> {auction.year}</p>
                <p><strong>Registreringsnummer:</strong> {auction.regNumber}</p>
                <p><strong>Minstepris:</strong> {auction.reservePrice}</p>
                <p><strong>Status:</strong> {auction.status}</p>
              </div>
              
              <Link to={`/auction/${auction._id}`} className="btn btn-primary">Vis Detaljer</Link>
              
            </div>
            
          ))}
        </div>
      ) : (
        <p>Ingen auksjoner funnet.</p>
      )}
    </div>
  );
};

export default MyAuctions;
