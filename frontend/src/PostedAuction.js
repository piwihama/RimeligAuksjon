import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client'; // Import Socket.IO
import './PostedAuction.css';
import Header from './Header';
import Footer from './Footer';

const mapBidders = (bids) => {
  let bidderMap = {};
  let bidderCounter = 1;

  bids.forEach(bid => {
    if (!bidderMap[bid.bidder]) {
      bidderMap[bid.bidder] = `Budgiver ${bidderCounter}`;
      bidderCounter++;
    }
  });

  return bidderMap;
};

function PostedAuction() {
  const { id } = useParams();
  const [auction, setAuction] = useState(null);
  const [bidAmount, setBidAmount] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [timeLeft, setTimeLeft] = useState({});
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [endDate, setEndDate] = useState(null);
  const [bidderMap, setBidderMap] = useState({});
  let socket;

  useEffect(() => {
    // Initialize WebSocket connection
    socket = io('wss://ws.rimeligauksjon.no', {
      transports: ['websocket', 'polling', 'flashsocket'],
    });

    // Log connection status
    socket.on('connect', () => {
      console.log('WebSocket connection established');
    });

    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
    });

    socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    // Listen for real-time bid updates
    socket.on('bidUpdated', (updatedAuction) => {
      console.log('Received bid update:', updatedAuction);
      if (updatedAuction.auctionId === id) {
        setAuction(prevState => ({
          ...prevState,
          highestBid: updatedAuction.bidAmount,
          bids: [...prevState.bids, { amount: updatedAuction.bidAmount, bidder: 'Budgiver' }]
        }));
      }
    });

    // Cleanup the WebSocket connection on component unmount
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [id]);

  useEffect(() => {
    if (auction && auction.bids) {
      const mappedBidders = mapBidders(auction.bids);
      setBidderMap(mappedBidders);
    }
  }, [auction]);

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
      const minsteBudøkning = parseFloat(auction.minsteBudøkning) || 100;
      const minimumBid = parseFloat(auction.highestBid) + minsteBudøkning;
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

    const parsedBidAmount = parseFloat(bidAmount);
    const minsteBudøkning = parseFloat(auction.minsteBudøkning) || 100;
    const minimumBid = parseFloat(auction.highestBid) + minsteBudøkning;

    if (!bidAmount || isNaN(parsedBidAmount)) {
      setError('Ugyldig budbeløp');
      return;
    }

    if (parsedBidAmount < minimumBid) {
      setError(`Bud må være større enn minimumsbudet på ${minimumBid},-`);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Du må være innlogget for å legge inn bud.');
        return;
      }

      // Log message before sending the bid through WebSocket
      console.log('Sender bud gjennom WebSocket:', parsedBidAmount);

      // Send the bid through WebSocket
      socket.emit('placeBid', { auctionId: id, bidAmount: parsedBidAmount });

      // Send the bid via HTTP request as a backup
      await axios.post(
        `https://rimelig-auksjon-backend.vercel.app/api/liveauctions/${id}/bid`,
        { bidAmount: parsedBidAmount },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setSuccessMessage('Bud lagt inn vellykket!');

      const auctionResponse = await axios.get(
        `https://rimelig-auksjon-backend.vercel.app/api/liveauctions/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setAuction(auctionResponse.data);
    } catch (error) {
      const message = error.response?.data?.message || 'Feil ved innlegging av bud. Prøv igjen.';
      setError(message);
      console.error('Error placing bid:', error.response?.data || error);
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
          </div> 
          {auction.status !== 'Utgått' && (
            <div className="bid-section">
              <form onSubmit={handleBidSubmit}>
                <div className="form-group">
                  <label style={{ marginBottom: '3px'}} htmlFor="bidAmount">Budbeløp</label>
                  <small style={{ fontSize: '10px', marginBottom: '1px'}} className="form-text text-muted">
                    Beløpet som foreslås her er minimumsbudet. Du kan by mer om ønskelig.
                  </small>
                  <input
                    type="number"
                    id="bidAmount"
                    name="bidAmount"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    required
                    min={parseFloat(auction.highestBid) + (parseFloat(auction.minsteBudøkning) || 100)}
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
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default PostedAuction;
