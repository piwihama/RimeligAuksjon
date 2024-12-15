import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';
import Header from './Header';
import axios from 'axios';
import Footer from './Footer';

function Home() {
  const [auctions, setAuctions] = useState([]);
  const [visibleAuctions, setVisibleAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAuctions();
  }, []);

  const fetchAuctions = async () => {
    try {
      const response = await axios.get('https://rimelig-auksjon-backend.vercel.app/api/liveauctions');
      const auctionsWithTimeLeft = response.data.map((auction) => ({
        ...auction,
        timeLeft: calculateTimeLeft(auction.endDate),
      }));
      setAuctions(auctionsWithTimeLeft);
      setInitialVisibleAuctions(auctionsWithTimeLeft);
    } catch (error) {
      console.error('Error fetching auctions:', error);
    } finally {
      setLoading(false);
    }
  };

  const setInitialVisibleAuctions = (auctionsList) => {
    if (auctionsList.length >= 4) {
      setVisibleAuctions(getRandomItems(auctionsList, 4));
    } else {
      setVisibleAuctions(auctionsList);
    }
  };

  const getRandomItems = (list, count) => {
    const shuffled = [...list].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (auctions.length > 4) {
        setVisibleAuctions((prevVisible) => {
          const remainingAuctions = auctions.filter(
            (auction) => !prevVisible.includes(auction)
          );

          if (remainingAuctions.length === 0) return prevVisible;

          const randomNewAuction = remainingAuctions[Math.floor(Math.random() * remainingAuctions.length)];
          const randomIndexToReplace = Math.floor(Math.random() * prevVisible.length);

          const newVisible = [...prevVisible];
          newVisible[randomIndexToReplace] = randomNewAuction;

          return newVisible;
        });
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [auctions]);

  const calculateTimeLeft = (endDate) => {
    const difference = new Date(endDate) - new Date();
    let timeLeft = {};

    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    } else {
      timeLeft = {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
      };
    }

    return timeLeft;
  };

  return (
    <div>
      <Header />
      <div className="home-container">
        <div className="home-content">
          <div className="home-banner">
            <div className="home-banner-content">
              <h1>Lavere gebyrer. Bedre auksjonsopplevelse.</h1>
              <p>Våre auksjonsrådgivere støtter deg gjennom hele salgsprosessen.</p>
              <strong><p>Helt kostnadsfritt</p></strong>
              <button className="home-banner-button" onClick={() => navigate('/info')}>
                Les mer her
              </button>
            </div>
          </div>

          <div className="home-auctions-section">
            <h2>Fremhevede Auksjoner</h2>
            {loading ? (
              <p>Laster inn auksjoner...</p>
            ) : auctions.length === 0 ? (
              <p>Ingen auksjoner tilgjengelig for øyeblikket.</p>
            ) : (
              <div className="home-auction-list">
                {visibleAuctions.map((auction) => (
                  <div
                    key={auction._id}
                    className="home-auction-item"
                    onClick={() => navigate(`/liveauctions/${auction._id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <img
                      src={auction.imageUrls && auction.imageUrls.length > 0 ? auction.imageUrls[0] : '/path-to-default-image.jpg'}
                      alt={`${auction.brand} ${auction.model}`}
                      className="home-auction-image"
                    />
                    <div className="home-auction-details">
                      <h3>
                        {auction.brand} {auction.model} {auction.year}
                      </h3>
                      <span>{auction.mileage} KM</span>
                      <div className="home-auction-smalldetails">
                        <div className="home-title-value-auction">
                          <span className="home-auction-title">
                            <strong>Gjenstår:</strong>
                          </span>
                          <span className="home-auction-value" style={{ color: 'rgb(211, 13, 13)', fontWeight: 'bold' }}>
                            {auction.timeLeft.days}D {auction.timeLeft.hours}t {auction.timeLeft.minutes}min {auction.timeLeft.seconds}s
                          </span>
                        </div>
                        <div className="home-title-value-auction">
                          <span className="home-auction-title">
                            <strong>Høyeste Bud:</strong>
                          </span>
                          <span className="home-auction-value" style={{ color: 'rgb(211, 13, 13)', fontWeight: 'bold' }}>
                            {auction.highestBid},-
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default Home;
