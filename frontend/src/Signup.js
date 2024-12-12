import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import validation from './SignupValidation';
import axios from 'axios';
import './Signup.css';
import Header from './Header';
import Footer from './Footer';

function Signup() {
  const [values, setValues] = useState({
    firstName: '',
    lastName: '',
    email: '',
    confirmEmail: '',
    password: '',
    mobile: '',
    birthDate: '',
    address1: '',
    address2: '',
    postalCode: '',
    city: '',
    country: 'Norge',
    accountNumber: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [userId, setUserId] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleInput = (event) => {
    setValues(prev => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const validationErrors = validation(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length === 0) {
      setIsSubmitting(true);
    }
  };

  useEffect(() => {
    if (isSubmitting) {
      axios.post('https://rimelig-auksjon-backend.vercel.app/signup', values)
        .then(res => {
          console.log('Response from server:', res);
          setIsSubmitting(false);
          if (res.data.userId) {
            setUserId(res.data.userId);
            setOtpSent(true);
            setSuccessMessage('Engangskode er sendt til din e-post. Vennligst sjekk e-posten din.');
          }
        })
        .catch(err => {
          console.error('Error from server:', err);
          if (err.response && err.response.status === 400) {
            setErrors({ email: 'Email already in use. Please login or use a different email.' });
          }
          setIsSubmitting(false);
        });
    }
  }, [isSubmitting, values]);

  const handleOtpSubmit = (event) => {
    event.preventDefault();
    axios.post('https://rimelig-auksjon-backend.vercel.app/verify-otp', { email: values.email, otp })
      .then(res => {
        console.log('OTP verified:', res);
        setSuccessMessage('Email verified successfully. Redirecting to login page.');
        setTimeout(() => navigate('/login'), 2000); // Redirect to login page after 2 seconds
      })
      .catch(err => {
        console.error('Error verifying OTP:', err);
        setErrors({ otp: 'Ugyldig OTP. Vennligst prøv igjen.' });
      });
  };

  return (
    <div>
    <Header />
    <div className="signup-container">
      <div className="signup-box">
        <h2 className="signup-heading">Registrer deg</h2>
        
        <p className="signup-info">
          Velkommen! Opprett en konto for å delta i våre auksjoner. Vi beskytter informasjonen din med sikker kryptering og følger alle personvernregler.
        </p>
  
        {successMessage && <div className="signup-alert signup-alert-success">{successMessage}</div>}
  
        {!otpSent ? (
          <form onSubmit={handleSubmit}>
            <div className="signup-form-group">
              <label htmlFor="firstName"><strong>Fornavn</strong></label>
              <input type="text" placeholder="Fornavn" name="firstName" onChange={handleInput} className="signup-form-control" />
              {errors.firstName && <span className="signup-text-danger">{errors.firstName}</span>}
            </div>
  
            <div className="signup-form-group">
              <label htmlFor="lastName"><strong>Etternavn</strong></label>
              <input type="text" placeholder="Etternavn" name="lastName" onChange={handleInput} className="signup-form-control" />
              {errors.lastName && <span className="signup-text-danger">{errors.lastName}</span>}
            </div>
  
            <div className="signup-form-group">
              <label htmlFor="email"><strong>E-post</strong></label>
              <input type="email" placeholder="E-post" name="email" onChange={handleInput} className="signup-form-control" />
              {errors.email && <span className="signup-text-danger">{errors.email}</span>}
            </div>
  
            <div className="signup-form-group">
              <label htmlFor="confirmEmail"><strong>Bekreft E-post</strong></label>
              <input type="email" placeholder="Bekreft E-post" name="confirmEmail" onChange={handleInput} className="signup-form-control" />
              {errors.confirmEmail && <span className="signup-text-danger">{errors.confirmEmail}</span>}
            </div>
  
            <div className="signup-form-group">
              <label htmlFor="password"><strong>Passord</strong></label>
              <div className="signup-input-group">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Passord"
                  name="password"
                  onChange={handleInput}
                  className="signup-form-control"
                />
                <button
                  type="button"
                  className="signup-btn-outline-secondary"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "Skjul" : "Vis"}
                </button>
              </div>
              {errors.password && <span className="signup-text-danger">{errors.password}</span>}
            </div>
  
            <div className="signup-form-group">
              <label htmlFor="mobile"><strong>Mobil</strong></label>
              <input type="text" placeholder="Mobil" name="mobile" onChange={handleInput} className="signup-form-control" />
              {errors.mobile && <span className="signup-text-danger">{errors.mobile}</span>}
            </div>
  
            <div className="signup-form-group">
              <label htmlFor="birthDate"><strong>Fødselsdato</strong></label>
              <input type="date" name="birthDate" onChange={handleInput} className="signup-form-control" />
              {errors.birthDate && <span className="signup-text-danger">{errors.birthDate}</span>}
            </div>
  
            <div className="signup-form-group">
              <label htmlFor="address1"><strong>Adresse</strong></label>
              <input type="text" placeholder="Adresse" name="address1" onChange={handleInput} className="signup-form-control" />
              {errors.address1 && <span className="signup-text-danger">{errors.address1}</span>}
            </div>
  
            <div className="signup-form-group">
              <label htmlFor="address2"><strong>Adresse 2</strong></label>
              <input type="text" placeholder="Adresse 2" name="address2" onChange={handleInput} className="signup-form-control" />
              {errors.address2 && <span className="signup-text-danger">{errors.address2}</span>}
            </div>
  
            <div className="signup-form-group">
              <label htmlFor="postalCode"><strong>Postnummer</strong></label>
              <input type="text" placeholder="Postnummer" name="postalCode" onChange={handleInput} className="signup-form-control" />
              {errors.postalCode && <span className="signup-text-danger">{errors.postalCode}</span>}
            </div>
  
            <div className="signup-form-group">
              <label htmlFor="city"><strong>Sted</strong></label>
              <input type="text" placeholder="Sted" name="city" onChange={handleInput} className="signup-form-control" />
              {errors.city && <span className="signup-text-danger">{errors.city}</span>}
            </div>
  
            <div className="signup-form-group">
              <label htmlFor="country"><strong>Land</strong></label>
              <input type="text" placeholder="Land" name="country" value="Norge" readOnly className="signup-form-control" />
              {errors.country && <span className="signup-text-danger">{errors.country}</span>}
            </div>
  
            <div className="signup-form-group">
              <label htmlFor="accountNumber"><strong>Kontonummer</strong></label>
              <input type="text" placeholder="Kontonummer" name="accountNumber" onChange={handleInput} className="signup-form-control" />
              {errors.accountNumber && <span className="signup-text-danger">{errors.accountNumber}</span>}
            </div>
  
            <button type="submit" className="signup-btn signup-btn-success signup-w-100"><strong>Registrer</strong></button>
            <p className="signup-terms-text">Ved å registrere deg godtar du våre <Link to="/terms" className="signup-link">vilkår og betingelser</Link>.</p>
            <Link to="/" className="signup-btn signup-btn-default signup-w-100">Har du allerede en konto? Logg inn</Link>
          </form>
        ) : (
          <form onSubmit={handleOtpSubmit}>
            <div className="signup-form-group">
              <label htmlFor="otp"><strong>Engangskode (OTP)</strong></label>
              <input type="text" placeholder="Skriv inn OTP" name="otp" onChange={(e) => setOtp(e.target.value)} className="signup-form-control" autoComplete="off" />
              {errors.otp && <span className="signup-text-danger">{errors.otp}</span>}
            </div>
            <button type="submit" className="signup-btn signup-btn-success signup-w-100"><strong>Bekreft OTP</strong></button>
          </form>
        )}
      </div>
    </div>
    <Footer />
  </div>
  
);
}

export default Signup;
