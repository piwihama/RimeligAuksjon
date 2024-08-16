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
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }

    axios.get('https://rimelig-auksjon-backend.vercel.app/api/auctions', {
      headers: {
        Authorization: `Bearer ${token}`
      }
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
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(response => {
        setLiveAuctions(response.data);
        const initialIndexes = {};
        response.data.forEach(auction => {
          initialIndexes[auction._id] = 0;
        });
        setCurrentImageIndex(prevState => ({ ...prevState, ...initialIndexes }));
      })
      .catch(error => {
        console.error('Error fetching live auctions:', error);
      });
  }, [navigate]);

  const handleEdit = (id) => {
    navigate(`/admin/edit-auction/${id}`);
  };

  const handleDelete = (id) => {
    const token = localStorage.getItem('token');
    axios.delete(`https://rimelig-auksjon-backend.vercel.app/api/auctions/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(() => {
        setAuctions(auctions.filter(auction => auction._id !== id));
      })
      .catch(error => {
        console.error('Error deleting auction:', error);
      });
  };

  const handleEditLive = (id) => {
    navigate(`/admin/edit-liveauction/${id}`);
  };

  const handleDeleteLive = (id) => {
    const token = localStorage.getItem('token');
    axios.delete(`https://rimelig-auksjon-backend.vercel.app/api/liveauctions/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(() => {
        setLiveAuctions(liveAuctions.filter(liveAuction => liveAuction._id !== id));
      })
      .catch(error => {
        console.error('Error deleting live auction:', error);
      });
  };

  const handleCreateLiveAuction = (id) => {
    navigate(`/admin/create-liveauction/${id}`);
  };

  const handleViewLiveAuction = (id) => {
    navigate(`/liveauctions/${id}`);
  };

  const handleNextImage = (auctionId, imageCount) => {
    setCurrentImageIndex(prevState => ({
      ...prevState,
      [auctionId]: (prevState[auctionId] + 1) % imageCount,
    }));
  };

  const handlePrevImage = (auctionId, imageCount) => {
    setCurrentImageIndex(prevState => ({
      ...prevState,
      [auctionId]: (prevState[auctionId] - 1 + imageCount) % imageCount,
    }));
  };

  return (
    <div className="admin-dashboard-container">
      <div className="admin-dashboard-header">
        <h1>Admin Dashboard</h1>
        <button onClick={() => navigate('/admin/create-auction')} className="admin-btn admin-btn-primary">Create New Auction</button>
      </div>
      <div className="admin-dashboard-sections">
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
                    <p><strong>Reserve Price:</strong> {auction.reservePrice}</p>
                  </div>
                  <div className="admin-auction-actions">
                    <button onClick={() => handleEdit(auction._id)} className="admin-btn admin-btn-secondary">Edit</button>
                    <button onClick={() => handleDelete(auction._id)} className="admin-btn admin-btn-danger">Delete</button>
                    <button onClick={() => handleCreateLiveAuction(auction._id)} className="admin-btn admin-btn-success">Create Live Auction</button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
        <section className="admin-dashboard-section">
          <h2>Live Auctions</h2>
          <ul className="admin-live-auction-list">
            {liveAuctions.map(liveAuction => {
              const imageCount = liveAuction.images ? liveAuction.images.length : 0; // Endret fra liveAuctions.imageUrls
              const currentIndex = currentImageIndex[liveAuction._id] || 0;
              return (
                <li key={liveAuction._id} className="admin-live-auction-item">
                  <div className="admin-live-auction-details">
                    <h3>{liveAuction.brand} {liveAuction.model} - {liveAuction.year}</h3>
                    {liveAuction.images && liveAuction.images.length > 0 && ( // Endret fra liveAuction.imageUrls
                      <div className="admin-auction-carousel">
                        <img
                          src={liveAuction.images[currentIndex]} // Endret fra liveAuction.imageUrls
                          alt={`${liveAuction.brand} ${liveAuction.model}`}
                          className="admin-live-auction-image"
                        />
                        <button className="carousel-control prev" onClick={() => handlePrevImage(liveAuction._id, imageCount)}>&lt;</button>
                        <button className="carousel-control next" onClick={() => handleNextImage(liveAuction._id, imageCount)}>&gt;</button>
                      </div>
                    )}
                    <p><strong>Highest Bid:</strong> {liveAuction.highestBid}</p>
                    <p><strong>Status:</strong> {liveAuction.status}</p>
                  </div>
                  <div className="admin-live-auction-actions">
                    <button onClick={() => handleEditLive(liveAuction._id)} className="admin-btn admin-btn-secondary">Edit</button>
                    <button onClick={() => handleDeleteLive(liveAuction._id)} className="admin-btn admin-btn-danger">Delete</button>
                    <button onClick={() => handleViewLiveAuction(liveAuction._id)} className="admin-btn admin-btn-info">View</button>
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
