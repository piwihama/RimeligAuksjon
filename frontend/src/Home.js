import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import './Home.css'; // Importer CSS for å style headeren
import Header from './Header';
import axios from 'axios';
import Footer from './Footer';  // Juster stien hvis Footeren ligger et annet sted

function Home() {
  const [auctions, setAuctions] = useState([]);
  const [visibleAuctions, setVisibleAuctions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    fetchAuctions();
  }, []);
  
  const navigate = useNavigate();

  const handleButtonClick = () => {
    navigate('/info');
  };

  useEffect(() => {
    if (auctions.length > 0) {
      setVisibleAuctions(auctions.slice(0, 3));
    }
  }, [auctions]);

  useEffect(() => {
    const interval = setInterval(() => {
      const nextIndex = (currentIndex + 1) % auctions.length;
      setCurrentIndex(nextIndex);
      setVisibleAuctions(auctions.slice(nextIndex, nextIndex + 3));
    }, 5000); // Change auction every 5 seconds

    return () => clearInterval(interval);
  }, [auctions, currentIndex]);

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

  const updateAuctionTimes = () => {
    setVisibleAuctions((prevAuctions) =>
      prevAuctions.map((auction) => ({
        ...auction,
        timeLeft: calculateTimeLeft(auction.endDate),
      }))
    );
  };

  useEffect(() => {
    const interval = setInterval(updateAuctionTimes, 1000); // Update every second

    return () => clearInterval(interval);
  }, [visibleAuctions]);

  const fetchAuctions = async () => {
    try {
      const response = await axios.get('http://localhost:8082/api/liveauctions');
      const auctionsWithTimeLeft = response.data.map((auction) => ({
        ...auction,
        timeLeft: calculateTimeLeft(auction.endDate),
      }));
      setAuctions(auctionsWithTimeLeft);
    } catch (error) {
      console.error('Error fetching auctions:', error);
    }
  };

  return (
    <div>
      <Header />
      <div className="home-container">
        <div className="home-content">
          <div className="home-banner">
            <div className="home-banner-content">
              <h1>Selg bilen hos oss - Helt enkelt!</h1>
              <p>Joda! Våre auksjonsrådgivere hjelper deg med bilsalget - fra start til slutt.</p>
              <strong><p>Helt kostnadsfritt</p></strong>
              <button className="home-banner-button" onClick={handleButtonClick}>
              Les mer her</button>
            </div>
          </div>

          <div className="home-auctions-section">
            <h2>Fremhevede Auksjoner</h2>
            <div className="home-auction-list">
              {visibleAuctions.map((auction) => (
                <div key={auction._id} className="home-auction-item" onClick={() => navigate(`/liveauctions/${auction._id}`)}
                  style={{ cursor: 'pointer' }} >
                  <img src={auction.images[0]} alt={`${auction.brand} ${auction.model}`} className="home-auction-image" />
                  <div className="home-auction-details">
                    <h3>{auction.brand} {auction.model} {auction.year} </h3>
                    <p style={{ fontWeight: '', fontSize: '17px' }}>{auction.mileage} KM</p>
                    <div className='home-auction-smalldetails'>
                      <div className='home-title-value-auction'>
                        <span className="home-auction-title"><strong>Gjenstår:</strong></span>
                        <span className="home-auction-value" style={{ color: 'rgb(211, 13, 13)', fontWeight: 'bold' }}>
                          {auction.timeLeft.days} Dager {auction.timeLeft.hours}t {auction.timeLeft.minutes}min {auction.timeLeft.seconds}sek
                        </span>
                      </div>
                      <div className='home-title-value-auction'>
                        <span className="home-auction-title"><strong>Høyeste Bud:</strong></span>
                        <span className="home-auction-value" style={{ color: 'rgb(211, 13, 13)', fontWeight: 'bold' }}>{auction.highestBid},-</span>
                      </div>
                    </div>
                    <Link to={`/liveauctions/${auction._id}`} className="home-auction-link">
                      Se auksjon
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default Home;
