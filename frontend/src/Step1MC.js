import React from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import './BilForm.css'; // Bruk samme CSS eller opprett en for MC
import Header from './Header';
import Footer from './Footer';

const Step1MC = ({ formData = {}, setFormData, nextStep }) => {
  const initialFormData = {
    regNumber: formData.regNumber || '', // Initialiser regNumber
    ...formData, // Resten av dataene
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
                console.log('API response:', mcData); // Log hele API-responsen for debugging

                if (!mcData.kjoretoydataListe || mcData.kjoretoydataListe.length === 0) {
                  console.error('MC data ikke funnet for dette registreringsnummeret');
                  return;
                }

                const mcInfo = mcData.kjoretoydataListe[0] || {}; // Hvis første element ikke finnes, sett tomt objekt
                const tekniskeData = mcInfo.godkjenning?.tekniskGodkjenning?.tekniskeData || {};

                console.log('MC Info:', mcInfo); // Logg MC-info for å se hva du får fra API-et
                console.log('Tekniske Data:', tekniskeData); // Logg tekniske data

                // Oppdater formData med MC-spesifikke verdier, sjekk om feltene er arrays før du bruker dem
                const updatedFormData = {
                  ...formData,
                  ...values,
                  brand: Array.isArray(tekniskeData.generelt?.merke) ? tekniskeData.generelt.merke[0] || '' : '',
                  model: Array.isArray(tekniskeData.generelt?.handelsbetegnelse) ? tekniskeData.generelt.handelsbetegnelse[0] || '' : '',
                  year: mcInfo.godkjenning?.forstegangsGodkjenning?.forstegangRegistrertDato?.split('-')[0] || '',
                  chassisNumber: mcInfo.kjoretoyId?.understellsnummer || '',
                  power: tekniskeData.motorOgDrivverk?.motor?.[0]?.maksNettoEffekt || '', // Forvent at dette er en array
                  fuel: tekniskeData.miljodata?.miljoOgDrivstoffGruppe?.[0]?.drivstoffKodeMiljodata?.kodeNavn || '', // Forvent at dette er en array
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
