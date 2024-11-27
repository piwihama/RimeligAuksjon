import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
    category: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortOption, setSortOption] = useState('avsluttes-forst');

  const navigate = useNavigate();
  const location = useLocation();

  // Update category based on URL path
  useEffect(() => {
    const path = location.pathname.split('/');
    const categoryPath = path[path.length - 1];
    const categoryMap = {
      bil: 'car',
      bat: 'boat',
      mc: 'motorcycle',
      torg: 'marketplace',
    };
  
    const category = categoryMap[categoryPath] || '';
    console.log('Path:', path);
    console.log('Detected categoryPath:', categoryPath);
    console.log('Mapped category:', category);
        setFilters((prevFilters) => ({ ...prevFilters, category }));
    setPage(1);
  }, [location.pathname]);
  

  // Fetch auctions when filters, page, or sortOption change
  useEffect(() => {
    fetchLiveAuctions();
    fetchFilterCounts(filters.category);
    const interval = setInterval(updateAllTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [filters, page, sortOption]);

  const fetchLiveAuctions = useCallback(async () => {
    setLoading(true);
    try {
      // Fjern tomme eller unødvendige verdier fra filtrene
      const sanitizedFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => 
          value !== '' && value !== null && value !== undefined && (!Array.isArray(value) || value.length > 0)
        )
      );
  
      console.log('Sanitized filters:', sanitizedFilters); // Logging for debugging
  
      const queryParams = { page, limit: 10, ...sanitizedFilters };
      const token = localStorage.getItem('accessToken');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
  
      const response = await axios.get(
        'https://rimelig-auksjon-backend.vercel.app/api/liveauctions/filter',
        { params: queryParams, headers }
      );
  
      console.log('Backend response:', response.data);
  
      if (!Array.isArray(response.data)) {
        console.error('Unexpected response data:', response.data);
        setError('Uventet dataformat fra serveren.');
        setLoading(false);
        return;
      }
  
      setLiveAuctions((prevAuctions) =>
        page === 1 ? response.data : [...prevAuctions, ...response.data]
      );
      setHasMore(response.data.length > 0);
      setError(null);
  
      const newTimeLeftMap = {};
      response.data.forEach((auction) => {
        newTimeLeftMap[auction._id] = calculateTimeLeft(auction.endDate);
      });
      setTimeLeftMap(newTimeLeftMap);
    } catch (error) {
      console.error('Error fetching live auctions:', error);
      setError('Kunne ikke hente live auksjoner. Prøv igjen senere.');
    }
    setLoading(false);
  }, [filters, page, sortOption]);
  
  const fetchFilterCounts = async (category) => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.get(
        'https://rimelig-auksjon-backend.vercel.app/api/liveauctions/counts',
        { headers, params: { category } }
      );

      if (response.data && typeof response.data === 'object') {
        setFilterCounts(response.data);
      } else {
        console.error('Unexpected filter counts data:', response.data);
        setFilterCounts({});
      }
    } catch (error) {
      console.error('Error fetching filter counts:', error);
    }
  };

  const handleCategorySelect = useCallback((category) => {
    // Gyldige kategorier
    const validCategories = {
      car: 'bil',
      boat: 'bat',
      motorcycle: 'mc',
      marketplace: 'torg',
    };
  
    if (!validCategories[category]) {
      console.error(`Ugyldig kategori valgt: ${category}`);
      return;
    }
  
    // Rens opp filtre og oppdater kun kategori
    setFilters({
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
      category, // Oppdater med valgt kategori
    });
  
    // Tilbakestill til side 1 og naviger til korrekt URL
    setPage(1);
    setLiveAuctions([]);
    navigate(`/kategori/${validCategories[category]}`);
  }, [navigate]);
  
  const sortAuctions = (auctions) => {
    switch (sortOption) {
      case 'avsluttes-forst':
        return auctions.sort((a, b) => new Date(a.endDate) - new Date(b.endDate));
      case 'avsluttes-sist':
        return auctions.sort((a, b) => new Date(b.endDate) - new Date(a.endDate));
      case 'nyeste-auksjoner':
        return auctions.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
      case 'hoyeste-bud':
        return auctions.sort((a, b) => b.highestBid - a.highestBid);
      case 'laveste-bud':
        return auctions.sort((a, b) => a.highestBid - b.highestBid);
      default:
        return auctions;
    }
  };

  const handleSortChange = (e) => {
    setSortOption(e.target.value);
    setPage(1);
    setLiveAuctions([]);
  };

  const handleCheckboxChange = (e) => {
    const { name, value, checked } = e.target;
    const newValue = (name === 'brand' || name === 'model') ? value.toUpperCase() : value;
    setFilters((prevFilters) => {
      const newValues = checked
        ? [...prevFilters[name], newValue]
        : prevFilters[name].filter((v) => v !== newValue);
      return { ...prevFilters, [name]: newValues };
    });
    setPage(1);
  };

  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilters((prevFilters) => ({
      ...prevFilters,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setPage(1);
  };

  const calculateTimeLeft = (endDate) => {
    const difference = new Date(endDate) - new Date();
    if (difference > 0) {
      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    }
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  };

  const updateAllTimeLeft = () => {
    setTimeLeftMap((prevTimeLeftMap) => {
      const updatedTimeLeftMap = { ...prevTimeLeftMap };
      liveAuctions.forEach((auction) => {
        updatedTimeLeftMap[auction._id] = calculateTimeLeft(auction.endDate);
      });
      return updatedTimeLeftMap;
    });
  };
  return (
    <div>
      <Header onCategorySelect={handleCategorySelect} />
      <div className="whole-container">
        <div className="live-auctions-container">
          <aside className="filters-section">
            <p className="kategoribiltitle">Kategori / Bil</p>
            <h2>Filtrer auksjoner</h2>
            <button
              type="button"
              className="toggle-filters-button"
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? 'Skjul filtre' : 'Vis søkefiltre'}
            </button>
            <form className={showFilters ? 'filters-form open' : 'filters-form'}>
              <div className="filter-group">
                <h3>Karosseri</h3>
                {['Stasjonsvogn', 'Cabriolet', 'Kombi 5-dørs', 'Flerbruksbil', 'Pickup', 'Kombi 3-dørs', 'Sedan', 'Coupe', 'SUV/Offroad', 'Kasse'].map((type) => (
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
              {/* Other filter groups like Brand, GearType, Fuel, etc. */}
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
              </form>
          </aside>
          <section className="auctions-section">
            <div className="sort-options">
              <label htmlFor="sort">Sorter etter:</label>
              <select id="sort" value={sortOption} onChange={handleSortChange}>
                <option value="avsluttes-forst">Avsluttes først</option>
                <option value="avsluttes-sist">Avsluttes sist</option>
                <option value="nyeste-auksjoner">Nyeste auksjoner</option>
                <option value="hoyeste-bud">Høyeste bud</option>
                <option value="laveste-bud">Laveste bud</option>
              </select>
            </div>
            {loading ? (
              <p>Laster inn auksjoner...</p>
            ) : error ? (
              <p className="error-message">{error}</p>
            ) : liveAuctions.length === 0 ? (
              <p>Ingen aktive auksjoner for øyeblikket</p>
            ) : (
              liveAuctions.map((auction) => {
                const timeLeft = calculateTimeLeft(auction.endDate);
                const formattedDate = new Date(auction.endDate).toLocaleDateString('no-NO', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                });
                return (
                  <div key={auction._id} className="auction-item" onClick={() => navigate(`/liveauctions/${auction._id}`)} style={{ cursor: 'pointer' }}>
                    <img src={auction.imageUrls && auction.imageUrls.length > 0 ? auction.imageUrls[0] : '/path-to-default-image.jpg'} alt={`${auction.brand} ${auction.model} `} className="auction-image" />
                    <div className="auction-info">
                      <h2>{auction.brand.toUpperCase()} {auction.model.toUpperCase()} - {auction.year} - {auction.mileage}</h2>

                      <div className="auction-detail">
    <span className="left-text"><strong>Avsluttes:</strong></span>
    <span className="right-text" style={{ color: 'rgb(211, 13, 13)', fontWeight: 'bold' }}>
        {new Date(auction.endDate).toLocaleDateString('no-NO', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })}
    </span>
</div>


                      <div className="auction-detail">
                        <span className="left-text"><strong>Gjenstår:</strong></span>
                        <span className="right-text" style={{ color: 'rgb(211, 13, 13)', fontWeight: 'bold' }}>{timeLeft.days} Dager {timeLeft.hours}t {timeLeft.minutes}min {timeLeft.seconds}sek</span>
                      </div>
                      <div className="auction-detail">
                        <span className="left-text"><strong>Høyeste Bud:</strong></span>
                        <span className="right-text" style={{ color: 'rgb(211, 13, 13)', fontWeight: 'bold' }}>{auction.highestBid},-</span>
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