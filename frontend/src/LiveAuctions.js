import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from './Header';
import './LiveAuctions.css';
import Footer from './Footer';

function LiveAuctions() {
  const [liveAuctions, setLiveAuctions] = useState([]);
  const [timeLeftMap, setTimeLeftMap] = useState({});
  const [filterCounts, setFilterCounts] = useState({});
  const [filters, setFilters] = useState({
    brand: [],
    model: '',
    year: '',
    location: [],
    minPrice: '',
    maxPrice: '',
    karosseri: [],
    fuel: [],
    gearType: [],
    driveType: [],
    auctionDuration: '',
    reservePrice: '',
    auctionWithoutReserve: false,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false); // Legg til lastestatus
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    fetchLiveAuctions();
    const interval = setInterval(() => {
      updateAllTimeLeft();
    }, 1000);
    return () => clearInterval(interval);
  }, [filters, page]);

  useEffect(() => {
    fetchFilterCounts();
  }, []);

  const fetchLiveAuctions = async () => {
    setLoading(true); // Start lasting
    try {
      const queryParams = { page, limit: 10 };

      for (const key in filters) {
        if (Array.isArray(filters[key])) {
          if (filters[key].length > 0) {
            queryParams[key] = filters[key].join(',');
          }
        } else if (filters[key]) {
          queryParams[key] = filters[key];
        }
      }

      const headers = {};
      const token = localStorage.getItem('token');
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await axios.get('https://rimelig-auksjon-backend.vercel.app/api/liveauctions/filter', {
        params: queryParams,
        headers: headers
      });

      setLiveAuctions(prevAuctions => [...prevAuctions, ...response.data]);
      setHasMore(response.data.length > 0);
      setError(null);

      // Oppdater tid for hver auksjon
      const newTimeLeftMap = {};
      response.data.forEach(auction => {
        newTimeLeftMap[auction._id] = calculateTimeLeft(auction.endDate);
      });
      setTimeLeftMap(newTimeLeftMap);
    } catch (error) {
      console.error('Error fetching live auctions:', error);
      setError('Kunne ikke hente live auksjoner. Prøv igjen senere.');
    }
    setLoading(false); // Stopp lasting
  };

  const fetchFilterCounts = async () => {
    try {
      const headers = {};
      const token = localStorage.getItem('token');
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await axios.get('https://rimelig-auksjon-backend.vercel.app/api/liveauctions/counts', {
        headers: headers
      });
      setFilterCounts(response.data);
      setError(null);
    } catch (error) {
      console.error('Error fetching filter counts:', error);
      setError('Kunne ikke hente filtertellerne. Prøv igjen senere.');
    }
  };

  const handleCheckboxChange = (e) => {
    const { name, value, checked } = e.target;
    const newValue = (name === 'brand' || name === 'model') ? value.toUpperCase() : value;
    setFilters(prevFilters => {
      const newValues = checked
        ? [...prevFilters[name], newValue]
        : prevFilters[name].filter(v => v !== newValue);
      return { ...prevFilters, [name]: newValues };
    });
    setPage(1);
    setLiveAuctions([]);
  };

  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = (name === 'brand' || name === 'model') ? value.toUpperCase() : value;
    setFilters({
      ...filters,
      [name]: type === 'checkbox' ? checked : newValue
    });
    setPage(1);
    setLiveAuctions([]);
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      setPage(prevPage => prevPage + 1);
    }
  };

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

  const updateAllTimeLeft = () => {
    setTimeLeftMap(prevTimeLeftMap => {
      const updatedTimeLeftMap = { ...prevTimeLeftMap };
      liveAuctions.forEach(auction => {
        updatedTimeLeftMap[auction._id] = calculateTimeLeft(auction.endDate);
      });
      return updatedTimeLeftMap;
    });
  };

  return (
    <div>
      <Header />
      <div className='whole-container'>
        <div className="live-auctions-container">
          <aside className="filters-section">
            <h2>Filtrer auksjoner</h2>
            <button
              type="button"
              className="toggle-filters-button"
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? 'Skjul filtre' : 'Vis søkefiltre'}
            </button>
            <form onSubmit={(e) => e.preventDefault()} className={showFilters ? 'filters-form open' : 'filters-form'}>
              <div className="filter-group">
                <h3>Karosseri</h3>
                {['Stasjonsvogn', 'Cabriolet', 'Kombi 5-dørs', 'Flerbruksbil', 'Pickup', 'Kombi 3-dørs', 'Sedan', 'Coupe', 'SUV/Offroad', 'Kasse'].map(type => (
                  <div key={type}>
                    <input
                      type="checkbox"
                      id={type}
                      name="karosseri"
                      value={type}
                      checked={filters.karosseri.includes(type)}
                      onChange={handleCheckboxChange}
                    />
                    <label htmlFor={type}>{type} ({filterCounts.karosseri?.[type] || 0})</label>
                  </div>
                ))}
              </div>
              <div className="filter-group">
                <h3>Merke</h3>
                {[
                  'Audi', 'BMW', 'BYD', 'Chevrolet', 'Chrysler', 'Citroen', 'Dodge', 'Ferrari', 'Fiat', 'Ford', 
                  'Honda', 'Hyundai', 'Jaguar', 'Jeep', 'Kia', 'Lamborghini', 'Land Rover', 'Lexus', 'Maserati', 
                  'Mazda', 'Mercedes-Benz', 'Mini', 'Mitsubishi', 'Nissan', 'Opel', 'Peugeot', 'Porsche', 'Renault', 
                  'Rolls Royce', 'Saab', 'Seat', 'Skoda', 'Subaru', 'Suzuki', 'Tesla', 'Toyota', 'Volkswagen', 'Volvo'
                ].map(brand => (
                  <div key={brand}>
                    <input
                      type="checkbox"
                      id={brand}
                      name="brand"
                      value={brand.toUpperCase()}
                      checked={filters.brand.includes(brand.toUpperCase())}
                      onChange={handleCheckboxChange}
                    />
                    <label htmlFor={brand}>{brand} ({filterCounts.brand?.[brand.toUpperCase()] || 0})</label>
                  </div>
                ))}
              </div>
              <div className="filter-group">
                <label htmlFor="model">Modell</label>
                <input
                  type="text"
                  id="model"
                  name="model"
                  value={filters.model}
                  onChange={handleFilterChange}
                />
              </div>
              <div className="filter-group">
                <label htmlFor="year">Årsmodell</label>
                <input
                  type="number"
                  id="year"
                  name="year"
                  value={filters.year}
                  onChange={handleFilterChange}
                />
              </div>
              <div className="filter-group">
                <h3>Fylke</h3>
                {['Akershus', 'Aust-Agder', 'Buskerud', 'Finnmark', 'Hedmark', 'Hordaland', 'Møre og Romsdal', 'Nordland', 'Nord-Trøndelag', 'Oppland', 'Oslo', 'Rogaland', 'Sogn og Fjordane', 'Sør-Trøndelag', 'Telemark', 'Troms', 'Vest-Agder', 'Vestfold', 'Østfold'].map(location => (
                  <div key={location}>
                    <input
                      type="checkbox"
                      id={location}
                      name="location"
                      value={location}
                      checked={filters.location.includes(location)}
                      onChange={handleCheckboxChange}
                    />
                    <label htmlFor={location}>{location} ({filterCounts.location?.[location] || 0})</label>
                  </div>
                ))}
              </div>
              <div className="filter-group">
                <label htmlFor="minPrice">Min Pris</label>
                <input
                  type="number"
                  id="minPrice"
                  name="minPrice"
                  value={filters.minPrice}
                  onChange={handleFilterChange}
                />
              </div>
              <div className="filter-group">
                <label htmlFor="maxPrice">Max Pris</label>
                <input
                  type="number"
                  id="maxPrice"
                  name="maxPrice"
                  value={filters.maxPrice}
                  onChange={handleFilterChange}
                />
              </div>
              <div className="filter-group">
                <label htmlFor="auctionWithoutReserve">Uten Minstepris</label>
                <input
                  type="checkbox"
                  id="auctionWithoutReserve"
                  name="auctionWithoutReserve"
                  checked={filters.auctionWithoutReserve}
                  onChange={handleFilterChange}
                />
              </div>
              <div className="filter-group">
                <label htmlFor="auctionDuration">Auksjonsvarighet (dager)</label>
                <input
                  type="number"
                  id="auctionDuration"
                  name="auctionDuration"
                  value={filters.auctionDuration}
                  onChange={handleFilterChange}
                />
              </div>
              <div className="filter-group">
                <h3>Drivstoff</h3>
                {['Bensin', 'Diesel', 'Elektrisitet', 'Hybrid'].map(fuel => (
                  <div key={fuel}>
                    <input
                      type="checkbox"
                      id={fuel}
                      name="fuel"
                      value={fuel}
                      checked={filters.fuel.includes(fuel)}
                      onChange={handleCheckboxChange}
                    />
                    <label htmlFor={fuel}>{fuel} ({filterCounts.fuel?.[fuel] || 0})</label>
                  </div>
                ))}
              </div>
              <div className="filter-group">
                <h3>Girtype</h3>
                {['Automat', 'Manuell'].map(gearType => (
                  <div key={gearType}>
                    <input
                      type="checkbox"
                      id={gearType}
                      name="gearType"
                      value={gearType}
                      checked={filters.gearType.includes(gearType)}
                      onChange={handleCheckboxChange}
                    />
                    <label htmlFor={gearType}>{gearType} ({filterCounts.gearType?.[gearType] || 0})</label>
                  </div>
                ))}
              </div>
              <div className="filter-group">
                <h3>Hjuldrift</h3>
                {['Bakhjulstrekk', 'Firehjulstrekk', 'Framhjulstrekk'].map(driveType => (
                  <div key={driveType}>
                    <input
                      type="checkbox"
                      id={driveType}
                      name="driveType"
                      value={driveType}
                      checked={filters.driveType.includes(driveType)}
                      onChange={handleCheckboxChange}
                    />
                    <label htmlFor={driveType}>{driveType} ({filterCounts.driveType?.[driveType] || 0})</label>
                  </div>
                ))}
              </div>
              <button onClick={fetchLiveAuctions} className="live-btn live-btn-primary">Filtrer</button>
            </form>
          </aside>
          <section className="auctions-section">
            {error && <p className="error-message">{error}</p>}
            {liveAuctions.length === 0 && !error ? (
              <p>Ingen aktive auksjoner for øyeblikket</p>
            ) : (
              liveAuctions.map(auction => {
                const timeLeft = calculateTimeLeft(auction.endDate);
                const formattedDate = new Date(auction.endDate).toLocaleDateString('no-NO', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                });
                return (
                  <div key={auction._id} className="auction-item" onClick={() => navigate(`/liveauctions/${auction._id}`)}
                    style={{ cursor: 'pointer' }} // Dette gir en visuell indikasjon på at hele elementet er klikkbart
                  >
                    <img src={auction.images[0]} alt={`${auction.brand} ${auction.model}`} className="auction-image" />
                    <div className="auction-info">
                      <h2>{auction.brand.toUpperCase()} {auction.model.toUpperCase()} - {auction.year} </h2>
                      <div className="auction-detail">
                        <span className="left-text"><strong>Gjenstår:</strong></span>
                        <span className="right-text" style={{ color: 'rgb(211, 13, 13)', fontWeight: 'bold'}}>{timeLeft.days} Dager {timeLeft.hours}t {timeLeft.minutes}min {timeLeft.seconds}sek</span>
                      </div>
                      <div className="auction-detail">
                        <span className="left-text"><strong>Høyeste Bud:</strong></span>
                        <span className="right-text"style={{color: 'rgb(211, 13, 13)', fontWeight: 'bold'}}>{auction.highestBid},-</span>
                      </div>
                      <div className="auction-detail">
                        <span className="left-text"><strong>Antall Bud:</strong></span>
                        <span className="right-text"style={{color: 'rgb(211, 13, 13)', fontWeight: 'bold'}}>{auction.bidCount}</span>
                      </div>
                      <div className="auction-detail">
                        <span className="left-text"><strong>Avsluttes:</strong></span>
                        <span className="right-text">{formattedDate}</span>
                      </div>
                      <div className="auction-detail">
                        <span className="left-text"><strong>Status:</strong></span>
                        <span className="right-text">{auction.status}</span>
                      </div>
                      <div className="auction-detail">
                        <span className="left-text"><strong>Sted:</strong></span>
                        <span className="right-text">{auction.location}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
           
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default LiveAuctions;
