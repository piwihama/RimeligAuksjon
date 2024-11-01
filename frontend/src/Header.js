import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Header.css';
import LoginModal from './LoginModal';
import { isAuthenticated } from './auth';
import { Helmet } from 'react-helmet';

function Header({ onCategorySelect }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalPurpose, setModalPurpose] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);

  const navigate = useNavigate();

  // Effekt som oppdaterer logg inn status når komponenten først monteres
  useEffect(() => {
    const loggedInStatus = isAuthenticated();
    console.log('Initial User authenticated:', loggedInStatus); // For debugging
    setLoggedIn(loggedInStatus);
  }, []);

  // Effekt som oppdaterer logg inn status hver gang token endrer seg
  useEffect(() => {
    const handleStorageChange = () => {
      const isUserLoggedIn = isAuthenticated();
      console.log('Token changed, updating login status:', isUserLoggedIn); // For debugging
      setLoggedIn(isUserLoggedIn);
    };

    window.addEventListener('storage', handleStorageChange);

    // Cleanup listener når komponenten fjernes
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAuthNavigation = (path) => {
    if (loggedIn) {
      navigate(path);
    } else {
      scrollToTop();
      setModalPurpose(path === '/minside' ? 'login' : 'nyauksjon');
      setModalOpen(true);
    }
  };

  const handleSearch = (event) => {
    event.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/search?q=${searchTerm}`);
      scrollToTop();
    }
  };

  return (
    <>
      <Helmet>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Helmet>
      <header className="header-top">
        <div className="upper-row">
          <a className="logo-large" href="/home" title="RimeligAuksjon.no">RIMELIGAUKSJON.NO</a>
          <form onSubmit={handleSearch} className="search-form">
            <div className="search-container">
              <input
                id="auksjonen-search"
                placeholder="Hva leter du etter?"
                type="search"
                className="search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button type="submit" className="search-button">
                <i className="material-icons" style={{ fontSize: '16px' }}>search</i>
              </button>
            </div>
          </form>

          <div className="header-button-container">
            <Link to="/info" className="header-button info-button" onClick={scrollToTop}>
              <i className="material-icons">info</i>
              <span>Infosenter</span>
            </Link>

            <button onClick={() => handleAuthNavigation('/nyauksjon')} className="header-button nyauksjon-button">
              <i className="material-icons">add_circle</i>
              <span>Ny Auksjon</span>
            </button>

            {loggedIn ? (
              <button onClick={() => navigate('/minside')} className="header-button">
                <i className="material-icons">person</i>
                <span>Min Side</span>
              </button>
            ) : (
              <button onClick={() => { scrollToTop(); setModalPurpose('login'); setModalOpen(true); }} className="header-button">
                <i className="material-icons">login</i>
                <span>Logg Inn</span>
              </button>
            )}
          </div>
        </div>

        <nav className="menu">
          <button onClick={() => onCategorySelect('car')} className="menu-button">
            <i className="material-icons">directions_car</i>Bil
          </button>
          <button onClick={() => onCategorySelect('boat')} className="menu-button">
            <i className="material-icons">directions_boat</i>Båt
          </button>
          <button onClick={() => onCategorySelect('motorcycle')} className="menu-button">
            <i className="material-icons">two_wheeler</i>MC
          </button>
          <button onClick={() => onCategorySelect('marketplace')} className="menu-button">
            <i className="material-icons">store</i>Torg
          </button>
        </nav>

        <LoginModal isOpen={modalOpen} onRequestClose={() => setModalOpen(false)} purpose={modalPurpose} />
      </header>

      <nav className="mobile-bottom-nav">
        <button onClick={() => { scrollToTop(); handleAuthNavigation('/minside'); }} className="bottom-nav-button">
          <i className="material-icons">person</i>
          <span>{loggedIn ? 'Min Side' : 'Logg Inn'}</span>
        </button>
        <Link to="/info" className="bottom-nav-button" onClick={scrollToTop}>
          <i className="material-icons">info</i>
          <span>Infosenter</span>
        </Link>
        <button onClick={() => { scrollToTop(); handleAuthNavigation('/nyauksjon'); }} className="bottom-nav-button">
          <i className="material-icons">add_circle</i>
          <span>Ny Auksjon</span>
        </button>
      </nav>
    </>
  );
}

export default Header;
