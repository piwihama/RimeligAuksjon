import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';

function AdminDashboard() {
  const [auctions, setAuctions] = useState([]);
  const [liveAuctions, setLiveAuctions] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      navigate('/');
      return;
    }
  
    axios.get('https://rimelig-auksjon-backend.vercel.app/api/auctions', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(response => {
        setAuctions(response.data);
        const initialIndexes = {};
        response.data.forEach(auction => {
          initialIndexes[auction._id] = 0;
        });
        setCurrentImageIndex(initialIndexes);
      })
      .catch(error => {
        console.error('Error fetching auctions:', error);
        navigate('/');
      });
  
    axios.get('https://rimelig-auksjon-backend.vercel.app/api/liveauctions', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(response => {
        setLiveAuctions(response.data);
        const liveIndexes = {};
        response.data.forEach(liveAuction => {
          liveIndexes[liveAuction._id] = 0;
        });
        setCurrentImageIndex(prevState => ({ ...prevState, ...liveIndexes }));
      })
      .catch(error => {
        console.error('Error fetching live auctions:', error);
      });
  }, [navigate]);
  

  const handleEdit = (id) => {
    navigate(`/admin/edit-auction/${id}`);
  };

  const handleDelete = (id) => {
    const token = localStorage.getItem('accessToken');
    axios.delete(`https://rimelig-auksjon-backend.vercel.app/api/auctions/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(() => {
        setAuctions(auctions.filter(auction => auction._id !== id));
        clearAllCache(token); // Tømmer all cache etter sletting
      })
      .catch(error => {
        console.error('Error deleting auction:', error);
      });
  };

  const handleEditLive = (id) => {
    navigate(`/admin/edit-liveauction/${id}`);
  };

  const handleDeleteLive = (id) => {
    const token = localStorage.getItem('accessToken');
    axios.delete(`https://rimelig-auksjon-backend.vercel.app/api/liveauctions/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(() => {
        setLiveAuctions(liveAuctions.filter(liveAuction => liveAuction._id !== id));
        clearAllCache(token); // Tømmer all cache etter sletting
      })
      .catch(error => {
        console.error('Error deleting live auction:', error);
      });
  };

  const clearAllCache = (token) => {
    axios.post('https://rimelig-auksjon-backend.vercel.app/api/clear-cache', {}, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(() => {
        console.log('Cache cleared successfully');
      })
      .catch(error => {
        console.error('Error clearing cache:', error);
      });
  };

  const handleCreateLiveAuction = (id) => {
    navigate(`/admin/create-liveauction/${id}`);
  };

  const handleViewLiveAuction = (id) => {
    navigate(`/liveauctions/${id}`);
  };

 // Funksjon for å bla til neste bilde
const handleNextImage = (auctionId, imageCount) => {
  setCurrentImageIndex(prevState => ({
    ...prevState,
    [auctionId]: (prevState[auctionId] + 1) % imageCount,
  }));
};

// Funksjon for å bla til forrige bilde
const handlePrevImage = (auctionId, imageCount) => {
  setCurrentImageIndex(prevState => ({
    ...prevState,
    [auctionId]: (prevState[auctionId] - 1 + imageCount) % imageCount,
  }));
};

// Oppdater initialisering av indeksene for live-auksjoner


  return (
    <div className="admin-dashboard-container">
      <div className="admin-dashboard-header">
        <h1>Admin Dashboard</h1>
      </div>
  
      <div className="admin-dashboard-sections">
        
        {/* Seksjon for auksjonsforespørsler */}
        <section className="admin-dashboard-section">
          <h2>Auksjonsforespørseler fra brukere</h2>
          <ul className="admin-auction-list">
            {auctions.map(auction => {
              const imageCount = auction.imageUrls ? auction.imageUrls.length : 0;
              const currentIndex = currentImageIndex[auction._id] || 0;
              return (
                <li key={auction._id} className="admin-auction-item">
                  <div className="admin-auction-details">
                    <h3>{auction.brand} {auction.model} - {auction.year}</h3>
                    {auction.imageUrls && auction.imageUrls.length > 0 && (
                      <div className="admin-auction-carousel">
                        <img
                          src={auction.imageUrls[currentIndex]}
                          alt={`${auction.brand} ${auction.model}`}
                          className="admin-auction-image"
                        />
                        <button className="carousel-control prev" onClick={() => handlePrevImage(auction._id, imageCount)}>&lt;</button>
                        <button className="carousel-control next" onClick={() => handleNextImage(auction._id, imageCount)}>&gt;</button>
                      </div>
                    )}
                    <p><strong>Minstepris:</strong> {auction.reservePrice}</p>
                    <p><strong>Lokasjon:</strong> {auction.fylke}{auction.postkode || 'Ikke spesifisert'}</p>
                    <p><strong>Beskrivelse:</strong> {auction.description || 'Ingen beskrivelse tilgjengelig'}</p>
                  </div>
                  <div className="admin-auction-actions">
                    <button onClick={() => handleDelete(auction._id)} className="admin-btn admin-btn-danger">Slett forespørsel</button>
                    <button onClick={() => handleCreateLiveAuction(auction._id)} className="admin-btn admin-btn-success">Opprett en live auksjon</button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
  
        {/* Seksjon for live auksjoner */}
        <section className="admin-dashboard-section">
          <h2>Pågående live auksjoner</h2>
          <ul className="admin-live-auction-list">
            {liveAuctions.map(liveAuction => {
              const imageCount = liveAuction.imageUrls ? liveAuction.imageUrls.length : 0;
              const currentIndex = currentImageIndex[liveAuction._id] || 0;
              return (
                <li key={liveAuction._id} className="admin-live-auction-item">
                  <div className="admin-live-auction-details">
                    <h3>{liveAuction.brand} {liveAuction.model} - {liveAuction.year}</h3>
                    {liveAuction.imageUrls && liveAuction.imageUrls.length > 0 && (
                      <div className="admin-auction-carousel">
                        <img
                          src={liveAuction.imageUrls[currentIndex]}
                          alt={`${liveAuction.brand} ${liveAuction.model}`}
                          className="admin-live-auction-image"
                        />
                        <button className="carousel-control prev" onClick={() => handlePrevImage(liveAuction._id, imageCount)}>&lt;</button>
                        <button className="carousel-control next" onClick={() => handleNextImage(liveAuction._id, imageCount)}>&gt;</button>
                      </div>
                    )}
                    <p><strong>Høyeste bud hittil:</strong> {liveAuction.highestBid}</p>
                    <p><strong>Status:</strong> {liveAuction.status}</p>
    
                    <p><strong>Start dato:</strong> {liveAuction.startDate || 'Ikke spesifisert'}</p>
                    <p><strong>Lokasjon:</strong> {auction.fylke}{auction.postkode || 'Ikke spesifisert'}</p>
                  </div>
                  <div className="admin-live-auction-actions">
                    <button onClick={() => handleEditLive(liveAuction._id)} className="admin-btn admin-btn-secondary">Rediger</button>
                    <button onClick={() => handleDeleteLive(liveAuction._id)} className="admin-btn admin-btn-danger">Slett</button>
                    <button onClick={() => handleViewLiveAuction(liveAuction._id)} className="admin-btn admin-btn-info">Se auksjon</button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
  
      </div>
    </div>
  );
  
}
export default AdminDashboard;
