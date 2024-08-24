import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './CreateLiveAuction.css';

function CreateLiveAuction() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    brand: '',
    mileage: '',
    karosseri: '',
    model: '',
    year: '',
    reservePrice: '',
    auctionWithoutReserve: false,
    regNumber: '',
    chassisNumber: '',
    taxClass: '',
    fuel: '',
    gearType: '',
    driveType: '',
    mainColor: '',
    power: '',
    seats: '',
    owners: '',
    firstRegistration: '',
    doors: '',
    weight: '',
    co2: '',
    omregistreringsavgift: '',
    lastEUApproval: '',
    nextEUControl: '',
    description: '',
    conditionDescription: '',
    equipment: '',
    highestBid: '',
    bidCount: '',
    bidderCount: '',
    location: '',
    endDate: '',
    imageUrls: [],
    userId: '',
    userEmail: '',
    userName: '',
    auksjonsNummer: '',
    auksjonsgebyr: '',
    avsluttesDato: '',
    by: '',
    minsteBudøkning: '',
    månedligFinansiering: '',
    postkode: '',
    sted: '',
    fylke: '',
    status: '',
    extensionAfterLastBid: '',
    seller: '',
    businessSale: false,
    vat: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const imagePromises = files.map((file) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    });

    Promise.all(imagePromises).then((imageUrls) => {
      setFormData((prevState) => ({
        ...prevState,
        imageUrls: [...prevState.imageUrls, ...imageUrls],
      }));
    });
  };
  useEffect(() => {
    const fetchAuctionRequest = async () => {
      try {
        // Hent data fra auksjonsforespørselen ved hjelp av ID-en
        const response = await axios.get(`https://rimelig-auksjon-backend.vercel.app/api/auctionrequests/${id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });

        // Sett innhentede data til formData
        setFormData(response.data);
      } catch (error) {
        console.error('Error fetching auction request:', error);
      }
    };

    if (id) {
      fetchAuctionRequest(); // Bare kjør hvis en ID er tilstede
    }
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        'https://rimelig-auksjon-backend.vercel.app/api/liveauctions',
        formData,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      );
      alert('Live auction created successfully');
      navigate('/admin/dashboard');
    } catch (error) {
      console.error('Error creating live auction:', error);
    }
  };

  return (
    <div className="create-live-auction">
      <h1>Create Live Auction</h1>
      <form onSubmit={handleSubmit}>
        {/* Existing fields */}
        <div className="form-group">
          <label htmlFor="brand">Merke</label>
          <input type="text" id="brand" name="brand" value={formData.brand} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label htmlFor="mileage">Kilometeravstand</label>
          <input type="text" id="mileage" name="mileage" value={formData.mileage} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label htmlFor="karrosseri">Karosseri</label>
          <input type="text" id="karosseri" name="karosseri" value={formData.karosseri} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label htmlFor="model">Modell</label>
          <input type="text" id="model" name="model" value={formData.model} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label htmlFor="year">År</label>
          <input type="number" id="year" name="year" value={formData.year} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label htmlFor="reservePrice">Minstepris</label>
          <input type="number" id="reservePrice" name="reservePrice" value={formData.reservePrice} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label htmlFor="auctionWithoutReserve">Uten Minstepris</label>
          <input type="checkbox" id="auctionWithoutReserve" name="auctionWithoutReserve" checked={formData.auctionWithoutReserve} onChange={(e) => setFormData({ ...formData, auctionWithoutReserve: e.target.checked })} />
        </div>
        <div className="form-group">
          <label htmlFor="regNumber">Registreringsnummer</label>
          <input type="text" id="regNumber" name="regNumber" value={formData.regNumber} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label htmlFor="chassisNumber">Chassisnummer</label>
          <input type="text" id="chassisNumber" name="chassisNumber" value={formData.chassisNumber} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label htmlFor="taxClass">Avgiftsklasse</label>
          <input type="text" id="taxClass" name="taxClass" value={formData.taxClass} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label htmlFor="fuel">Drivstoff</label>
          <input type="text" id="fuel" name="fuel" value={formData.fuel} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label htmlFor="gearType">Girtype</label>
          <input type="text" id="gearType" name="gearType" value={formData.gearType} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label htmlFor="driveType">Driftstype</label>
          <input type="text" id="driveType" name="driveType" value={formData.driveType} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label htmlFor="mainColor">Hovedfarge</label>
          <input type="text" id="mainColor" name="mainColor" value={formData.mainColor} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label htmlFor="power">Effekt</label>
          <input type="text" id="power" name="power" value={formData.power} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label htmlFor="seats">Seter</label>
          <input type="number" id="seats" name="seats" value={formData.seats} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label htmlFor="owners">Antall eiere</label>
          <input type="text" id="owners" name="owners" value={formData.owners} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label htmlFor="firstRegistration">Førstegangsregistrering</label>
          <input type="date" id="firstRegistration" name="firstRegistration" value={formData.firstRegistration} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label htmlFor="doors">Dører</label>
          <input type="number" id="doors" name="doors" value={formData.doors} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label htmlFor="weight">Vekt</label>
          <input type="number" id="weight" name="weight" value={formData.weight} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label htmlFor="co2">CO2-utslipp</label>
          <input type="text" id="co2" name="co2" value={formData.co2} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label htmlFor="omregistreringsavgift">Omregistreringsavgift</label>
          <input type="text" id="omregistreringsavgift" name="omregistreringsavgift" value={formData.omregistreringsavgift} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label htmlFor="lastEUApproval">Sist EU-godkjent</label>
          <input type="date" id="lastEUApproval" name="lastEUApproval" value={formData.lastEUApproval} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label htmlFor="nextEUControl">Neste EU-kontroll</label>
          <input type="date" id="nextEUControl" name="nextEUControl" value={formData.nextEUControl} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label htmlFor="description">Beskrivelse</label>
          <textarea id="description" name="description" value={formData.description} onChange={handleChange}></textarea>
        </div>
        <div className="form-group">
          <label htmlFor="conditionDescription">Tilstandsbeskrivelse</label>
          <textarea id="conditionDescription" name="conditionDescription" value={formData.conditionDescription} onChange={handleChange}></textarea>
        </div>
        <div className="form-group">
          <label htmlFor="equipment">Utstyr</label>
          <textarea id="equipment" name="equipment" value={formData.equipment} onChange={handleChange}></textarea>
        </div>
        <div className="form-group">
          <label htmlFor="highestBid">Høyeste Bud</label>
          <input type="number" id="highestBid" name="highestBid" value={formData.highestBid} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label htmlFor="bidCount">Antall Bud</label>
          <input type="number" id="bidCount" name="bidCount" value={formData.bidCount} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label htmlFor="bidderCount">Antall Budgivere</label>
          <input type="number" id="bidderCount" name="bidderCount" value={formData.bidderCount} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label htmlFor="location">Lokasjon</label>
          <input type="text" id="location" name="location" value={formData.location} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label htmlFor="endDate">Sluttdato</label>
          <input type="datetime-local" id="endDate" name="endDate" value={formData.endDate} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label htmlFor="imageUrls">Bilder</label>
          <input type="file" id="imageUrls" multiple accept="image/*" onChange={handleImageChange} />
          <div className="image-preview">
            {formData.imageUrls.map((image, index) => (
              <div key={index} className="image-container">
                <img src={image} alt={`Auction Image ${index + 1}`} />
              </div>
            ))}
          </div>
        </div>
        {/* New fields from EditLiveAuction */}
        <div className="form-group">
          <label htmlFor="status">Status</label>
          <input type="text" id="status" name="status" value={formData.status} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label htmlFor="auksjonsNummer">Auksjonsnummer</label>
          <input type="text" id="auksjonsNummer" name="auksjonsNummer" value={formData.auksjonsNummer} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label htmlFor="auksjonsgebyr">Auksjonsgebyr</label>
          <input type="number" id="auksjonsgebyr" name="auksjonsgebyr" value={formData.auksjonsgebyr} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label htmlFor="avsluttesDato">Avsluttes dato</label>
          <input type="datetime-local" id="avsluttesDato" name="avsluttesDato" value={formData.avsluttesDato} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label htmlFor="by">By</label>
          <input type="text" id="by" name="by" value={formData.by} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label htmlFor="minsteBudøkning">Minste budøkning</label>
          <input type="number" id="minsteBudøkning" name="minsteBudøkning" value={formData.minsteBudøkning} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label htmlFor="månedligFinansiering">Månedlig finansiering</label>
          <input type="number" id="månedligFinansiering" name="månedligFinansiering" value={formData.månedligFinansiering} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label htmlFor="postkode">Postkode</label>
          <input type="text" id="postkode" name="postkode" value={formData.postkode} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label htmlFor="sted">Sted</label>
          <input type="text" id="sted" name="sted" value={formData.sted} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label htmlFor="fylke">Fylke</label>
          <input type="text" id="fylke" name="fylke" value={formData.fylke} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label htmlFor="extensionAfterLastBid">Forlengelse etter siste bud (minutter)</label>
          <input type="number" id="extensionAfterLastBid" name="extensionAfterLastBid" value={formData.extensionAfterLastBid} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label htmlFor="seller">Selger</label>
          <input type="text" id="seller" name="seller" value={formData.seller} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label htmlFor="businessSale">Er dette et firmasalget?</label>
          <select id="businessSale" name="businessSale" value={formData.businessSale} onChange={handleChange}>
            <option value={false}>Nei</option>
            <option value={true}>Ja</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="vat">MVA</label>
          <select id="vat" name="vat" value={formData.vat} onChange={handleChange}>
          <input type="text" id="vat" name="vat" value={formData.vat} onChange={handleChange} />
          </select>
        </div>
        <button type="submit">Create Live Auction</button>
      </form>
    </div>
  );
}

export default CreateLiveAuction;
