import React from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import './BilForm.css'; // Bruk samme CSS eller opprett en for MC
import Header from './Header';
import Footer from './Footer';

const Step1MC = ({ formData, setFormData, nextStep }) => {
  const validationSchema = Yup.object({
    regNumber: Yup.string().required('Registreringsnummer er påkrevd for MC')
  });

  return (
    <div>
      <Header />
      <div className="bil-container">
        <Formik
          initialValues={formData}
          validationSchema={validationSchema}
          onSubmit={async (values) => {
            try {
              const response = await fetch(`https://proxyservervegvesen.onrender.com/vehicle-data/${values.regNumber}`);

              const contentType = response.headers.get('content-type');
              if (contentType && contentType.indexOf('application/json') !== -1) {
                const mcData = await response.json();
                console.log(mcData); // Logg API-responsen

                // Sjekk om vi får riktig data for MC
                if (!mcData.kjoretoydataListe || mcData.kjoretoydataListe.length === 0) {
                  console.error('MC data ikke funnet for dette registreringsnummeret');
                  return;
                }

                const mcInfo = mcData.kjoretoydataListe[0];
                const tekniskeData = mcInfo.godkjenning?.tekniskGodkjenning?.tekniskeData || {};

                const updatedFormData = {
                  ...formData,
                  ...values,
                  brand: tekniskeData.generelt?.merke || '',
                  model: tekniskeData.generelt?.handelsbetegnelse || '',
                  year: mcInfo.godkjenning?.forstegangsGodkjenning?.forstegangRegistrertDato?.split('-')[0] || '',
                  chassisNumber: mcInfo.kjoretoyId?.understellsnummer || '',
                  power: tekniskeData.motorOgDrivverk?.motor?.[0]?.maksNettoEffekt || '',
                  fuel: tekniskeData.miljodata?.miljoOgDrivstoffGruppe?.[0]?.drivstoffKodeMiljodata?.kodeNavn || '',
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
          <Form className="bil-form">
            <h2>MC Registreringsnummer</h2>
            <div className="form-group">
              <label htmlFor="regNumber">Vennligst skriv inn registreringsnummeret på MC-en du ønsker å selge.</label>
              <Field name="regNumber" type="text" className="form-control" />
              <ErrorMessage name="regNumber" component="div" className="error" />
            </div>
            <button type="submit" className="btn btn-primary fetch-button">Neste</button>
          </Form>
        </Formik>
      </div>
      <Footer />
    </div>
  );
};

export default Step1MC;
