import React, { useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import './Step3.css';
import Header from './Header';
import Footer from './Footer';  // Juster stien hvis Footeren ligger et annet sted

const equipmentOptions = {
  "Sikkerhet": ['ABS-bremser', 'Airbag foran', 'Airbag side', 'Antiskrens', 'Antispinn', 'Gjenfinningssystem', 'Isofix', 'Startsperre', 'Stålbjelker'],
  "Comfort": ['Aircondition', 'Automatgir', 'Bagasjeromstrekk', 'Cruisekontroll', 'Cruisekontroll Adaptiv', 'Elektriske justerbare speil', 'Elektriske seter m. memory', 'Elektriske seter u. memory', 'Elektriske vinduer', 'Farget glass', 'Klimaanlegg', 'Kupevarmer', 'Luftfjæring', 'Midtarmlene', 'Oppvarmede seter'],
  "Underholdning": ['AUX-inngang', 'Bluetooth', 'CD-spiller', 'CD-veksler', 'DVD', 'Handsfree opplegg', 'Multifunksjonsratt', 'Navigasjon', 'Original telefon', 'Radio DAB+', 'Radio FM', 'Radio/CD', 'Radio/Kassett', 'Stereoanlegg', 'TV'],
  "Eksteriør": ['Alarm', 'Firehjulstrekk', 'Hengerfeste', 'Hengerfeste(Avtagbart)', 'Lasteholdere/skistativ', 'Lettmet. felg sommer', 'Lettmet. felg vinter', 'Lettmetallfelger', 'Metallic lakk', 'Mørke ruter bak', 'Soltak/glasstak', 'Takluke', 'Takrails', 'Vinterdekk', 'Xenonlys'],
  "Annet": ['Forvarmer motor', 'Helårsdekk', 'Kassettspiller', 'Keyless go', 'Kjørecomputer', 'Lyssensor', 'Motorvarmer', 'Nivåregulering', 'Nøkkelløs start', 'Parkeringssensor bak', 'Parkeringssensor foran', 'Regnsensor', 'Ryggekamera', 'Sentrallås', 'Servostyring', 'Sportsseter', 'Tiptronic']
};

const Step3 = ({ formData, setFormData, nextStep, prevStep }) => {
  const [dropdowns, setDropdowns] = useState({
    Sikkerhet: false,
    Komfort: false,
    Underholdning: false,
    Eksteriør: false,
    Annet: false
  });

  const toggleDropdown = (category) => {
    setDropdowns(prevState => ({
      ...prevState,
      [category]: !prevState[category]
    }));
  };

  const validationSchema = Yup.object({
    equipment: Yup.array().min(1, 'Velg minst ett utstyr').required('Utstyr er påkrevd')
  });

  return (
    <div>
      <Header />
      <div className="step3-container">
        <Formik
          initialValues={formData}
          validationSchema={validationSchema}
          onSubmit={(values) => {
            setFormData({ ...formData, ...values });
            nextStep();
          }}
        >
          <Form className="step3-form">
            <h2>Utstyr</h2>
            <div className="equipment-container">
              {Object.keys(equipmentOptions).map(category => (
                <div key={category} className="equipment-category">
                  <div className="dropdown" onClick={() => toggleDropdown(category)}>
                    {category}
                  </div>
                  <div className={`dropdown-content ${dropdowns[category] ? 'active' : ''}`}>
                    {equipmentOptions[category]?.map(item => ( // Sjekk for å sikre at equipmentOptions[category] eksisterer
                      <div className="step3-group" key={item}>
                        <label htmlFor={item}>
                          <Field
                            type="checkbox"
                            id={item}
                            name="equipment"
                            value={item}
                            className="step3-control"
                          />
                          {item}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <ErrorMessage name="equipment" component="div" className="step3-error" />
            <div className="step3-navigation">
              <button type="button" onClick={prevStep} className="step3-btn-primary">Tilbake</button>
              <button type="submit" className="step3-btn-primary">Neste</button>
            </div>
          </Form>
        </Formik>
      </div>
      <Footer />
    </div>
  );
};

export default Step3;
