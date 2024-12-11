import React, { useState } from 'react';
import './Summary.css';
import Footer from './Footer';
import Header from './Header';

const Summary = ({ formData, prevStep }) => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  let timeout = null; // For debounce

  const handleSubmit = async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      const token = localStorage.getItem('accessToken');
      const images = formData.images || [];
      const base64Images = images.map(img => (typeof img === 'string' && img.startsWith('data:image/')) ? img : null).filter(img => img !== null);

      const submissionData = { ...formData, images: base64Images };

      const response = await fetch('https://rimelig-auksjon-backend.vercel.app/api/auctions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(submissionData)
      });

      if (response.ok) {
        const data = await response.json();
        setIsSubmitted(true);

        // Trigger email sending
        await fetch('https://rimelig-auksjon-backend.vercel.app/send-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ documentId: data.insertedId })
        });
      } else {
        console.error("Error creating auction:", response.statusText);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClick = () => {
    if (timeout) return;
    handleSubmit();
    timeout = setTimeout(() => { timeout = null; }, 1000);
  };

  if (isSubmitted) {
    return (
      <div className="confirmation-message">
        <h2>Auksjonsforespørsel sendt inn!</h2>
        <p>Takk for din forespørsel. En av våre kundebehandlere vil kontakte deg snart.</p>
        <button type="button" onClick={() => window.location.href = '/home'} className="btn btn-primary">
          Tilbake til hjemmesiden
        </button>
      </div>
    );
  }

  return (
    <div>
      <Header />
      <div className="summary-container">
        <h2 className="summary-title">Sammendrag av Auksjon</h2>
        <p className="summary-info">Vennligst gå gjennom detaljene før du sender inn forespørselen.</p>

        <div className="summary-section">
          <h3>Bilinformasjon</h3>
          <ul className="summary-list">
            <li><strong>Registreringsnummer:</strong> {formData.regNumber}</li>
            <li><strong>Merke:</strong> {formData.brand}</li>
            <li><strong>Modell:</strong> {formData.model}</li>
            <li><strong>År:</strong> {formData.year}</li>
            <li><strong>Chassisnummer:</strong> {formData.chassisNumber}</li>
            <li><strong>Drivstoff:</strong> {formData.fuel}</li>
            <li><strong>Girtype:</strong> {formData.gearType}</li>
            <li><strong>Driftstype:</strong> {formData.driveType}</li>
            <li><strong>Hovedfarge:</strong> {formData.mainColor}</li>
            <li><strong>Kilometerstand:</strong> {formData.mileage}</li>
          </ul>
        </div>

        <div className="summary-section">
          <h3>Beskrivelse</h3>
          <p><strong>Beskrivelse:</strong> {formData.description}</p>
          <p><strong>Beskrivelse av tilstand:</strong> {formData.conditionDescription}</p>
        </div>

        <div className="summary-section">
          <h3>Utstyr</h3>
          <ul className="summary-list">
            {formData.equipment && formData.equipment.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="summary-section">
          <h3>Bilder</h3>
          <div className="image-preview-container">
            {formData.images && formData.images.map((img, index) => (
              <img key={index} src={img} alt={`Bilde ${index + 1}`} className="image-preview" />
            ))}
          </div>
        </div>

        <div className="summary-section">
          <h3>Auksjonsinnstillinger</h3>
          <ul className="summary-list">
            <li><strong>Auksjonsvarighet:</strong> {formData.auctionDuration} dager</li>
            <li><strong>Minstepris:</strong> {formData.reservePrice ? `${formData.reservePrice} NOK` : 'Ingen minstepris'}</li>
            <li><strong>Selges uten minstepris:</strong> {formData.auctionWithoutReserve ? 'Ja' : 'Nei'}</li>
          </ul>
        </div>

        <div className="form-navigation">
          <button type="button" onClick={prevStep} className="btn btn-secondary">Tilbake</button>
          <button type="button" onClick={handleClick} className="btn btn-primary" disabled={isLoading}>
            {isLoading ? 'Sender...' : 'Send inn'}
          </button>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Summary;
