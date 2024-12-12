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
    accountNumber: '',
    isSeller: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [userId, setUserId] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

  const [showEmailPassword, setShowEmailPassword] = useState(true);
  const [showAddress, setShowAddress] = useState(true);
  const [showOtherInfo, setShowOtherInfo] = useState(true);

  const handleInput = (event) => {
    const { name, value, type, checked } = event.target;
    setValues(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
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
          <p className="signup-info">Fyll ut skjemaet nedenfor for å opprette en konto.</p>

          {successMessage && <div className="signup-alert signup-alert-success">{successMessage}</div>}

          <form onSubmit={handleSubmit}>
            {/* E-post og Passord Dropdown */}
            <div className="signup-section">
              <button type="button" className="signup-dropdown-toggle" onClick={() => setShowEmailPassword(!showEmailPassword)}>
                {showEmailPassword ? '▼' : '▶'} E-post og Passord
              </button>
              {showEmailPassword && (
                <>
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
                </>
              )}
            </div>

            {/* Adresse Dropdown */}
            <div className="signup-section">
              <button type="button" className="signup-dropdown-toggle" onClick={() => setShowAddress(!showAddress)}>
                {showAddress ? '▼' : '▶'} Adresse
              </button>
              {showAddress && (
                <>
                  <div className="signup-form-group">
                    <label htmlFor="address1"><strong>Adresse</strong></label>
                    <input type="text" placeholder="Adresse" name="address1" onChange={handleInput} className="signup-form-control" />
                  </div>
                  <div className="signup-form-group">
                    <label htmlFor="postalCode"><strong>Postnummer</strong></label>
                    <input type="text" placeholder="Postnummer" name="postalCode" onChange={handleInput} className="signup-form-control" />
                  </div>
                  <div className="signup-form-group">
                    <label htmlFor="city"><strong>Sted</strong></label>
                    <input type="text" placeholder="Sted" name="city" onChange={handleInput} className="signup-form-control" />
                  </div>
                </>
              )}
            </div>

            {/* Annen Info Dropdown */}
            <div className="signup-section">
              <button type="button" className="signup-dropdown-toggle" onClick={() => setShowOtherInfo(!showOtherInfo)}>
                {showOtherInfo ? '▼' : '▶'} Annen Info
              </button>
              {showOtherInfo && (
                <>
                  <div className="signup-form-group">
                    <label htmlFor="mobile"><strong>Mobil</strong></label>
                    <input type="text" placeholder="Mobil" name="mobile" onChange={handleInput} className="signup-form-control" />
                  </div>
                  <div className="signup-form-group">
                    <label htmlFor="birthDate"><strong>Fødselsdato</strong></label>
                    <input type="date" name="birthDate" onChange={handleInput} className="signup-form-control" />
                  </div>
                  <div className="signup-form-group">
                    <label htmlFor="accountNumber">
                      <strong>Kontonummer (valgfritt)</strong>
                    </label>
                    <input type="text" placeholder="Kontonummer" name="accountNumber" onChange={handleInput} className="signup-form-control" />
                    <small className="signup-helper-text">Kun nødvendig hvis du er selger og ønsker å motta penger.</small>
                  </div>
                  <div className="signup-form-group">
                    <input
                      type="checkbox"
                      name="isSeller"
                      onChange={handleInput}
                      checked={values.isSeller}
                    />
                    <label htmlFor="isSeller">Jeg er en selger</label>
                  </div>
                </>
              )}
            </div>

            <button type="submit" className="signup-btn signup-btn-success signup-w-100"><strong>Registrer</strong></button>
            <p className="signup-terms-text">Ved å registrere deg godtar du våre <Link to="/terms" className="signup-link">vilkår og betingelser</Link>.</p>
            <Link to="/" className="signup-btn signup-btn-default signup-w-100">Har du allerede en konto? Logg inn</Link>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default Signup;