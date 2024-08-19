import React from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import './BilForm.css';
import Header from './Header';
import Footer from './Footer';

const Step1 = ({ formData, setFormData, nextStep }) => {
  const validationSchema = Yup.object({
    regNumber: Yup.string().required('Registreringsnummer er påkrevd')
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
              const response = await fetch(`https://www.vegvesen.no/ws/no/vegvesen/kjoretoy/felles/datautlevering/enkeltoppslag/kjoretoydata?kjennemerke=${values.regNumber}`, {
                method: 'GET',
                headers: {
                  'SVV-Authorization': 'Apikey e59b5fa7-0331-4359-9c99-bbe1a520db87',
                },
              });

              if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
              }

              const carData = await response.json();
              const carInfo = carData.kjoretoydataListe ? carData.kjoretoydataListe[0] : {};
              const tekniskeData = carInfo.godkjenning?.tekniskGodkjenning?.tekniskeData || {};

              const updatedFormData = {
                ...formData,
                ...values,
                brand: tekniskeData.generelt?.merke[0]?.merke || '',
                model: tekniskeData.generelt?.handelsbetegnelse[0] || '',
                year: carInfo.godkjenning?.forstegangsGodkjenning?.forstegangRegistrertDato?.split('-')[0] || '',
                chassisNumber: carInfo.kjoretoyId?.understellsnummer || '',
                taxClass: carInfo.godkjenning?.tekniskGodkjenning?.kjoretoyklassifisering?.beskrivelse || '',
                fuel: tekniskeData.miljodata?.miljoOgdrivstoffGruppe ? tekniskeData.miljodata.miljoOgDrivstoffGruppe[0]?.drivstoffKodeMiljodata?.kodeNavn || '' : '',
                gearType: tekniskeData.motorOgDrivverk?.girkassetype?.kodeBeskrivelse || '',
                driveType: tekniskeData.motorOgDrivverk?.kjoresystem?.kodeBeskrivelse || '',
                mainColor: tekniskeData.karosseriOgLasteplan?.rFarge ? tekniskeData.karosseriOgLasteplan.rFarge[0]?.kodeNavn || '' : '',
                power: tekniskeData.motorOgDrivverk?.motor && tekniskeData.motorOgDrivverk.motor.length > 0 ? tekniskeData.motorOgDrivverk.motor[0]?.maksNettoEffekt || '' : '',
                seats: tekniskeData.persontall?.sitteplasserTotalt || '',
                owners: carInfo.eierskap?.antall || '',
                firstRegistration: carInfo.godkjenning?.forstegangsGodkjenning?.forstegangRegistrertDato || '',
                doors: tekniskeData.karosseriOgLasteplan?.antallDorer ? tekniskeData.karosseriOgLasteplan.antallDorer[0] || '' : '',
                weight: tekniskeData.vekter?.egenvekt || '',
                co2: tekniskeData.miljodata?.forbrukOgUtslipp?.length > 0 ? tekniskeData.miljodata.forbrukOgUtslipp[0]?.co2BlandetKjoring || '' : '',
                omregistreringsavgift: carInfo.omregistreringsavgift || '',
                lastEUApproval: carInfo.periodiskKjoretoyKontroll?.sistGodkjent || '',
                nextEUControl: carInfo.periodiskKjoretoyKontroll?.kontrollfrist || '',
              };

              setFormData(updatedFormData);
              nextStep();
            } catch (error) {
              console.error('Error fetching car data:', error);
            }
          }}
        >
          <Form className="bil-form">
            <h2>Registreringsnummer</h2>
            <div className="form-group">
              <label htmlFor="regNumber">Vennligst skriv registreringsnummeret på bilen du ønsker å selge.</label>
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

export default Step1;
