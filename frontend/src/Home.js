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
  const [loading, setLoading] = useState(true); // Legger til loading state

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
      if (auctions.length > 0) {
        const nextIndex = (currentIndex + 1) % auctions.length;
        setCurrentIndex(nextIndex);
        setVisibleAuctions(auctions.slice(nextIndex, nextIndex + 3));
      }
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
      const response = await axios.get('https://rimelig-auksjon-backend.vercel.app/api/liveauctions');
      const auctionsWithTimeLeft = response.data.map((auction) => ({
        ...auction,
        timeLeft: calculateTimeLeft(auction.endDate),
      }));
      setAuctions(auctionsWithTimeLeft);
    } catch (error) {
      console.error('Error fetching auctions:', error);
    } finally {
      setLoading(false); // Sett loading til false når dataene er hentet eller hvis det er en feil
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
            {loading ? ( // Hvis loading er true, vis lastemeldingen
              <p>Laster inn auksjoner...</p>
            ) : auctions.length === 0 ? ( // Hvis det ikke er noen auksjoner
              <p>Ingen auksjoner tilgjengelig for øyeblikket.</p>
            ) : (
              <div className="home-auction-list">
                {visibleAuctions.map((auction) => (
                  <div key={auction._id} className="home-auction-item" onClick={() => navigate(`/liveauctions/${auction._id}`)}
                    style={{ cursor: 'pointer' }} >
                    <img 
                      src={auction.imageUrls && auction.imageUrls.length > 0 ? auction.imageUrls[0] : '/path-to-default-image.jpg'}
                      alt={`${auction.brand} ${auction.model}`} 
                      className="home-auction-image" 
                    />
                    <div className="home-auction-details">
                      <h3>{auction.brand} {auction.model} {auction.year}  {auction.mileage}</h3>
                      <span>{auction.mileage} KM</span>
                      {console.log(auction.mileage)} {/* Legg til denne linjen for debugging */}

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
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default Home;
