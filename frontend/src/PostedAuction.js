import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import './PostedAuction.css';
import Header from './Header';
import Footer from './Footer';

function PostedAuction() {
  const { id } = useParams();
  const [auction, setAuction] = useState(null);
  const [bidAmount, setBidAmount] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [timeLeft, setTimeLeft] = useState({});
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [endDate, setEndDate] = useState(null);

  useEffect(() => {
    const fetchAuction = async () => {
      try {
        const response = await axios.get(`https://rimelig-auksjon-backend.vercel.app/api/liveauctions/${id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setAuction(response.data);
        setEndDate(new Date(response.data.endDate));
        calculateTimeLeft(new Date(response.data.endDate));
      } catch (error) {
        console.error('Error fetching auction details:', error);
      }
    };
  
    fetchAuction();
  }, [id]);

  useEffect(() => {
    if (auction) {
      const minimumBid = parseInt(auction.highestBid) + parseInt(auction.minsteBudøkning);
      setBidAmount(minimumBid.toString());
    }
  }, [auction]);

  useEffect(() => {
    if (endDate) {
      const interval = setInterval(() => {
        calculateTimeLeft(endDate);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [endDate]);

  const calculateTimeLeft = (endDate) => {
    const difference = endDate - new Date();
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
      setAuction(prevState => ({
        ...prevState,
        status: 'Utgått'
      }));
    }

    setTimeLeft(timeLeft);
  };

  const handleBidSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    const minimumRequiredBid = parseInt(auction.highestBid) + parseInt(auction.minsteBudøkning);

    if (parseFloat(bidAmount) < minimumRequiredBid) {
      setError(`Bud må være minst ${minimumRequiredBid},-`);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `https://rimelig-auksjon-backend.vercel.app/api/liveauctions/${id}/bid`,
        { bidAmount: parseFloat(bidAmount) },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setSuccessMessage('Bud lagt inn vellykket!');
      // Re-fetch auction details after placing a bid
      const response = await axios.get(`https://rimelig-auksjon-backend.vercel.app/api/liveauctions/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAuction(response.data);
    } catch (error) {
      const message = error.response && error.response.data ? error.response.data.message : 'Feil ved innlegging av bud. Prøv igjen.';
      setError(message);
      console.error('Error placing bid:', error);
    }
  };

  const handleThumbnailClick = (index) => {
    setCurrentImageIndex(index);
  };

  if (!auction || !auction.imageUrls) return <div>Loading...</div>;

  return (
    <div className="posted-auction-page">
      <Header />
      <div className="auction-page">
        <div className="auction-gallery">
          <div className="main-image">
            <img
              src={auction.imageUrls[currentImageIndex]}
              alt={`Auksjonsbilde ${currentImageIndex + 1}`}
              className="posted-image-preview"
            />
          </div>
          <div className="thumbnail-gallery">
            {auction.imageUrls.map((image, index) => (
              <img
                key={index}
                src={image}
                alt={`Thumbnail ${index + 1}`}
                className={`thumbnail-image ${index === currentImageIndex ? 'active' : ''}`}
                onClick={() => handleThumbnailClick(index)}
              />
            ))}
          </div>
          <h1 className='posted-title'>{auction.brand} {auction.model} {auction.year} - {auction.mileage}KM</h1>
        </div>
        <div className="auction-info">
          <div className='info-top'>
            <div className='bid-and-finish'>
              <div className="posted-detail-item-top">
                <span className="detail-title">Høyeste bud:</span>
                <span className="top-value">{auction.highestBid},-</span>
              </div>
              <div className="posted-detail-item-top">
                <span className="detail-title">Avsluttes om:</span>
                <span className="top-value">{timeLeft.days}d {timeLeft.hours}t {timeLeft.minutes}min {timeLeft.seconds}sek</span>
              </div>
            </div>
          </div > 
            
          {auction.status !== 'Utgått' && (
            <div className="bid-section">
              <form onSubmit={handleBidSubmit}>
                <div className="form-group">
                  <label htmlFor="bidAmount">Budbeløp</label>
                  <small className="form-text text-muted">
                    Beløpet som foreslås her er minimumsbudet. Du kan by mer om ønskelig.
                  </small>
                  <input
                    type="number"
                    id="bidAmount"
                    name="bidAmount"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    required
                    min={auction.highestBid + auction.minsteBudøkning}
                  />
                </div>
                <div className="posted-detail-item">
                  <span className="detail-title">Minste budøkning:</span>
                  <span className="detail-value" style={{ color: 'red', fontWeight: 'bold' }}>
                    {auction.minsteBudøkning},-
                  </span>
                </div>
                <button type="submit" className="btn btn-primary">Legg inn bud</button>
                {error && <p className="error-message">{error}</p>}
                {successMessage && <p className="success-message">{successMessage}</p>}
              </form>
            </div>
          )}
          {auction.status === 'Utgått' && (
            <div className="auction-ended">
              <p>Auksjonen er avsluttet</p>
            </div>
          )}
          <div className="additional-info">
            <div className="posted-detail-item">
              <span className="detail-title">Avsluttes:</span>
              <span className="detail-value">{new Date(auction.endDate).toLocaleString()}</span>
            </div>
            <div className="posted-detail-item">
              <span className="detail-title">Selges av:</span>
              <span className="detail-value">{auction.seller}</span>
            </div>
            <div className="posted-detail-item">
              <span className="detail-title">Auksjonsgebyr:</span>
              <span className="detail-value">{auction.auksjonsgebyr},-</span>
            </div>
            <div className="posted-detail-item">
              <span className="detail-title">MVA:</span>
              <span className="detail-value">{auction.vatRate}%</span>
            </div>
            <div className="posted-detail-item">
              <span className="detail-title">Sted:</span>
              <span className="detail-value">{auction.location}</span>
            </div>
          </div>
          <div className="bid-list">
            <h3>Budhistorikk</h3>
            {auction.bids && auction.bids.length > 0 ? (
              <ul>
                {auction.bids.map((bid, index) => (
                  <li key={index}>
                    {bid.bidder} - {bid.amount},-
                  </li>
                ))}
              </ul>
            ) : (
              <p>Ingen bud er gitt enda</p>
            )}
          </div>
        </div>

        <div className="posted-auction-details">
          <div className='top-small-details'>
            <div className="posted-detail-item-bottom">
              <span className="detail-info-below">Beskrivelse</span>
              <span className="">{auction.description}</span>
              <span className="detail-info-below">Tilstand</span>
              <span className="">{auction.conditionDescription}</span>
              <span className="detail-info-below">Utstyr</span>
              {auction.equipment && (Array.isArray(auction.equipment) ? auction.equipment : auction.equipment.split(', ')).map((item, index) => (
                <span key={index} className="equipment-item">- {item}</span>
              ))}
            </div>
          </div>  
          <div className='posted-small-details'>
            <div className='posted-column'>
              <div className="posted-detail-item">
                <span className="detail-title">Har minstepris:</span>
                <span className="detail-value">{auction.auctionWithoutReserve ? "Ja" : "Nei"}</span>
              </div>
              <div className="posted-detail-item">
                <span className="detail-title">Drivstoff:</span>
                <span className="detail-value">{auction.fuel}</span>
              </div>
              <div className="posted-detail-item">
                <span className="detail-title">Girkasse:</span>
                <span className="detail-value">{auction.gearType}</span>
              </div>
              <div className="posted-detail-item">
                <span className="detail-title">Drivhjul:</span>
                <span className="detail-value">{auction.driveType}</span>
              </div>
              <div className="posted-detail-item">
                <span className="detail-title">Hovedfarge:</span>
                <span className="detail-value">{auction.mainColor}</span>
              </div>
              <div className="posted-detail-item">
                <span className="detail-title">Effekt:</span>
                <span className="detail-value">{auction.power} kW</span>
              </div>
              <div className="posted-detail-item">
                <span className="detail-title">Seter:</span>
                <span className="detail-value">{auction.seats}</span>
              </div>
              <div className="posted-detail-item">
                <span className="detail-title">Vekt:</span>
                <span className="detail-value">{auction.weight} kg</span>
              </div>
              <div className="posted-detail-item">
                <span className="detail-title">Dører:</span>
                <span className="detail-value">{auction.doors}</span>
              </div>
            </div>
            <div className='posted-column'>
              <div className="posted-detail-item">
                <span className="detail-title">Antall eiere:</span>
                <span className="detail-value">{auction.owners}</span>
              </div>
              <div className="posted-detail-item">
                <span className="detail-title">Første registrering:</span>
                <span className="detail-value">{auction.firstRegistration}</span>
              </div>
              <div className="posted-detail-item">
                <span className="detail-title">Avgiftsklasse:</span>
                <span className="detail-value">{auction.taxClass}</span>
              </div>
              <div className="posted-detail-item">
                <span className="detail-title">CO2-utslipp:</span>
                <span className="detail-value">{auction.co2} g/km</span>
              </div>
              <div className="posted-detail-item">
                <span className="detail-title">Omregistreringsavgift:</span>
                <span className="detail-value">{auction.omregistreringsavgift}</span>
              </div>
              <div className="posted-detail-item">
                <span className="detail-title">Sist godkjent EU-kontroll:</span>
                <span className="detail-value">{auction.lastEUApproval}</span>
              </div>
              <div className="posted-detail-item">
                <span className="detail-title">Chassisnr:</span>
                <span className="detail-value">{auction.chassisNumber}</span>
              </div>
              <div className="posted-detail-item">
                <span className="detail-title">Neste EU-kontroll:</span>
                <span className="detail-value">{auction.nextEUControl}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default PostedAuction;
