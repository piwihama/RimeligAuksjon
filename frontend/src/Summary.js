import React, { useState } from 'react';
import './Summary.css';
import Footer from './Footer';
import Header from './Header';



const Summary = ({ formData, prevStep }) => {
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Ensure formData.images are Base64 strings
      const images = formData.images || [];
      const base64Images = images.map(img => {
        if (typeof img === 'string' && img.startsWith('data:image/')) {
          return img; // already base64
        } else {
          console.error('Invalid image format:', img);
          return null;
        }
      }).filter(img => img !== null);

      // Include base64 images in the formData
      const submissionData = { ...formData, images: base64Images };

      // Create the auction
      const response = await fetch('hhttps://rimelig-auksjon-backend.vercel.app/api/auctions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(submissionData),
      });

      const result = await response.json();
      if (response.ok) {
        console.log('Auction created successfully:', result);
        setIsSubmitted(true);

        // Send images via email
        const emailResponse = await fetch('https://rimelig-auksjon-backend.vercel.app/send-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ documentId: result.insertedId, email: formData.email }),
        });

        if (emailResponse.ok) {
          console.log('Image and data sent via email successfully');
        } else {
          console.error('Error sending image and data via email');
        }
      } else {
        console.error('Error creating auction:', result);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
    }
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

    <div className="bil-container">
      <h2>Sammendrag</h2>
      <div className="summary-section">
        <h3>Bilinformasjon</h3>
        <p><strong>Registreringsnummer:</strong> {formData.regNumber}</p>
        <p><strong>Merke:</strong> {formData.brand}</p>
        <p><strong>Modell:</strong> {formData.model}</p>
        <p><strong>År:</strong> {formData.year}</p>
        <p><strong>Chassisnummer:</strong> {formData.chassisNumber}</p>
        <p><strong>Avgiftsklasse:</strong> {formData.taxClass}</p>
        <p><strong>Drivstoff:</strong> {formData.fuel}</p>
        <p><strong>Girtype:</strong> {formData.gearType}</p>
        <p><strong>Driftstype:</strong> {formData.driveType}</p>
        <p><strong>Hovedfarge:</strong> {formData.mainColor}</p>
        <p><strong>Effekt:</strong> {formData.power}</p>
        <p><strong>Antall seter:</strong> {formData.seats}</p>
        <p><strong>Antall eiere:</strong> {formData.owners}</p>
        <p><strong>1. gang registrert:</strong> {formData.firstRegistration}</p>
        <p><strong>Antall dører:</strong> {formData.doors}</p>
        <p><strong>Egenvekt:</strong> {formData.weight}</p>
        <p><strong>CO2-utslipp:</strong> {formData.co2}</p>
        <p><strong>Omregistreringsavgift:</strong> {formData.omregistreringsavgift}</p>
        <p><strong>Sist EU-godkjent:</strong> {formData.lastEUApproval}</p>
        <p><strong>Neste frist for EU-kontroll:</strong> {formData.nextEUControl}</p>
        <p><strong>Kilometeravstand:</strong> {formData.mileage}</p>

      </div>
      <div className="summary-section">
        <h3>Beskrivelse</h3>
        <p><strong>Beskrivelse:</strong> {formData.description}</p>
        <p><strong>Beskrivelse av tilstand:</strong> {formData.conditionDescription}</p>
      </div>
      <div className="summary-section">
        <h3>Utstyr</h3>
        <ul>
          {formData.equipment && formData.equipment.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </div>
      <div className="summary-section">
        <h3>Auksjonsinnstillinger</h3>
        <p><strong>Auksjonsvarighet:</strong> {formData.auctionDuration} dager</p>
        <p><strong>Minstepris:</strong> {formData.reservePrice}</p>
        <p><strong>Selges uten minstepris:</strong> {formData.auctionWithoutReserve ? 'Ja' : 'Nei'}</p>
      </div>
      <div className="summary-section">
        <h3>Bilder</h3>
        <div className="image-preview-container">
          {formData.previewImages && formData.previewImages.map((img, index) => (
            <img key={index} src={img} alt={`Bilde ${index + 1}`} className="image-preview" />
          ))}
        </div>
      </div>
      <div className="form-navigation">
        <button type="button" onClick={prevStep} className="btn btn-secondary">Tilbake</button>
        <button type="button" onClick={handleSubmit} className="btn btn-primary">Send inn</button>
      </div>

    </div>
          <Footer />
</div>
  );
};

export default Summary;
