import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './MinSide.css';
import Header from './Header'; // Make sure this points to your Header component
import Footer from './Footer';  // Juster stien hvis Footeren ligger et annet sted


function MinSide() {
  const [auctions, setAuctions] = useState([]);
  const [messages, setMessages] = useState([]);
  const [userDetails, setUserDetails] = useState({});
  const [activeSection, setActiveSection] = useState(null); // State to track active section
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.log('No token found, redirecting to login');
          navigate('/');
          return;
        }
  
        const auctionResponse = await axios.get('https://rimelig-auksjon-backend.vercel.app/api/myauctions', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        setAuctions(auctionResponse.data);
  
        const messageResponse = await axios.get('https://rimelig-auksjon-backend.vercel.app/api/mymessages', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        setMessages(messageResponse.data);
  
        const userResponse = await axios.get('https://rimelig-auksjon-backend.vercel.app/api/userdetails', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        setUserDetails(userResponse.data);
  
      } catch (error) {
        console.error('Error fetching data:', error.response ? error.response.data : error.message);
      }
    };
  
    fetchData();
  }, [navigate]);
  

  const handleUpdateDetails = () => {
    navigate('/account');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('role');
    navigate('/');
  };

  const toggleSection = (section) => {
    setActiveSection(activeSection === section ? null : section);
  };

  return (
    <div>
      <Header />

      <div className='myside-container'>
        <div className="myside-back-button-container">
          <h1>Min Side</h1>
          <p>Velkommen til din personlige side. Her kan du se og administrere dine auksjoner, meldinger, og kontoopplysninger.</p>
          <div className='myside-content'>
            <div className='myside-section'>
              <div className='myside-card'>
                <div className='myside-card-header' onClick={() => toggleSection('auctions')}>
                  <h5 className='myside-card-title'>Mine Auksjoner</h5>
                  <i className={`myside-toggle-icon ${activeSection === 'auctions' ? 'active' : ''}`}>&#9660;</i>
                </div>
                <div className={`myside-card-body ${activeSection === 'auctions' ? 'active' : ''}`}>
                  {auctions.length > 0 ? (
                    <div className="myside-auctions-grid">
                      {auctions.map(auction => (
                        <div className="myside-auction-card" key={auction._id}>
                          <h6>{auction.title}</h6>
                          {auction.images && auction.images.length > 0 && (
                            <img src={auction.images[0]} alt={auction.title} className="myside-auction-image" />
                          )}
                          <p><strong>Merke:</strong> {auction.brand}</p>
                          <p><strong>Modell:</strong> {auction.model}</p>
                          <p><strong>År:</strong> {auction.year}</p>
                          <p><strong>Registreringsnummer:</strong> {auction.regNumber}</p>
                          <p><strong>Minstepris:</strong> {auction.reservePrice}</p>
                          <p><strong>Status:</strong> {auction.status}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p>Ingen auksjoner funnet.</p>
                  )}
                  <a href='/myauctions' className='myside-btn myside-btn-primary'>Se Mine Auksjoner</a>
                </div>
              </div>
            </div>
            <div className='myside-section'>
              <div className='myside-card'>
                <div className='myside-card-header' onClick={() => toggleSection('messages')}>
                  <h5 className='myside-card-title'>Meldinger</h5>
                  <i className={`myside-toggle-icon ${activeSection === 'messages' ? 'active' : ''}`}>&#9660;</i>
                </div>
                <div className={`myside-card-body ${activeSection === 'messages' ? 'active' : ''}`}>
                  {messages.length > 0 ? (
                    <div className="myside-messages-grid">
                      {messages.map(message => (
                        <div className="myside-message-card" key={message._id}>
                          <p>{message.content}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p>Ingen meldinger funnet.</p>
                  )}
                  <a href='/messages' className='myside-btn myside-btn-primary'>Se Meldinger</a>
                </div>
              </div>
            </div>
            <div className='myside-section'>
              <div className='myside-card'>
                <div className='myside-card-header' onClick={() => toggleSection('account')}>
                  <h5 className='myside-card-title'>Kontoopplysninger</h5>
                  <i className={`myside-toggle-icon ${activeSection === 'account' ? 'active' : ''}`}>&#9660;</i>
                </div>
                <div className={`myside-card-body ${activeSection === 'account' ? 'active' : ''}`}>
                  <p><strong>Fornavn:</strong> {userDetails.firstName}</p>
                  <p><strong>Etternavn:</strong> {userDetails.lastName}</p>
                  <p><strong>Email:</strong> {userDetails.email}</p>
                  <button onClick={handleUpdateDetails} className='myside-btn myside-btn-primary'>Se mer og oppdater opplysninger</button>
                </div>
              </div>
            </div>
            <div className="myside-logout-button-container">
              <button onClick={handleLogout} className='myside-btn myside-btn-danger'>Logg ut</button>
            </div>
          </div>
        </div>
        <button onClick={() => navigate(-1)} className='myside-back-button'>Tilbake</button>
      </div>
      <Footer />

    </div>
  );
}

export default MinSide;
