import React from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import './BilForm.css'; // Bruk samme CSS eller opprett en for MC
import Header from './Header';
import Footer from './Footer';

const Step1MC = ({ formData = {}, setFormData, nextStep }) => {
  const initialFormData = {
    regNumber: formData.regNumber || '',
    brand: formData.brand || '',
    model: formData.model || '',
    year: formData.year || '',
    chassisNumber: formData.chassisNumber || '',
    power: formData.power || '',
    fuel: formData.fuel || '',
    weight: formData.weight || '',
    seats: formData.seats || '',
    co2: formData.co2 || '',
    gearType: formData.gearType || '',
    driveType: formData.driveType || '',
    firstRegistration: formData.firstRegistration || '',
    ...formData, // Resten av dataene for å sikre at vi ikke mister noen andre felter
  };

  const validationSchema = Yup.object({
    regNumber: Yup.string().required('Registreringsnummer er påkrevd for MC'),
  });

  return (
    <div>
      <Header />
      <div className="bil-container">
        <Formik
          initialValues={initialFormData}
          validationSchema={validationSchema}
          onSubmit={async (values) => {
            if (!values.regNumber) {
              console.error('Ingen registreringsnummer oppgitt');
              return;
            }

            try {
              const response = await fetch(`https://proxyservervegvesen.onrender.com/vehicle-data/${values.regNumber}`);
              const contentType = response.headers.get('content-type');
              if (contentType && contentType.indexOf('application/json') !== -1) {
                const mcData = await response.json();
                console.log('API response:', mcData);

                if (!mcData.kjoretoydataListe || mcData.kjoretoydataListe.length === 0) {
                  console.error('MC data ikke funnet for dette registreringsnummeret');
                  return;
                }

                const mcInfo = mcData.kjoretoydataListe[0] || {};
                const tekniskeData = mcInfo.godkjenning?.tekniskGodkjenning?.tekniskeData || {};

                console.log('MC Info:', mcInfo);
                console.log('Tekniske Data:', tekniskeData);

                // Trekk ut verdier på en måte som ikke prøver å kalle noen funksjoner
                const brand = tekniskeData.generelt?.merke?.[0] || tekniskeData.generelt?.merke || '';
                const model = tekniskeData.generelt?.handelsbetegnelse?.[0] || tekniskeData.generelt?.handelsbetegnelse || '';
                const power = tekniskeData.motorOgDrivverk?.motor?.[0]?.maksNettoEffekt || '';
                const fuel = tekniskeData.miljodata?.miljoOgDrivstoffGruppe?.[0]?.drivstoffKodeMiljodata?.kodeNavn || '';
                const weight = tekniskeData.vekter?.egenvekt || '';
                const seats = tekniskeData.persontall?.sitteplasserTotalt || '';
                const firstRegistration = mcInfo.forstegangsregistrering?.registrertForstegangNorgeDato || '';

                // Logg verdiene for å bekrefte at de er riktig hentet ut
                console.log('Brand:', brand, 'Model:', model, 'Power:', power, 'Fuel:', fuel);

                const updatedFormData = {
                  ...formData,
                  ...values,
                  brand,
                  model,
                  year: mcInfo.godkjenning?.forstegangsGodkjenning?.forstegangRegistrertDato?.split('-')[0] || '',
                  chassisNumber: mcInfo.kjoretoyId?.understellsnummer || '',
                  power,
                  fuel,
                  weight,
                  seats,
                  firstRegistration,
                };

                setFormData(updatedFormData);
                nextStep();
              } else {
                const textData = await response.text();
                console.error('Unexpected content type:', contentType);
                console.error('Response text:', textData);
              }
            } catch (error) {
              console.error('Error fetching MC data:', error);
            }
          }}
        >
          {() => (
            <Form className="bil-form">
              <h2>MC Registreringsnummer</h2>
              <div className="form-group">
                <label htmlFor="regNumber">Vennligst skriv inn registreringsnummeret på MC-en du ønsker å selge.</label>
                <Field name="regNumber" type="text" className="form-control" />
                <ErrorMessage name="regNumber" component="div" className="error" />
              </div>
              <button type="submit" className="btn btn-primary fetch-button">Neste</button>
            </Form>
          )}
        </Formik>
      </div>
      <Footer />
    </div>
  );
};

export default Step1MC;
