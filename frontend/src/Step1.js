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
              const response = await fetch(`/api/vehicle-data/${values.regNumber}`, {
                method: 'GET',
                headers: {
                  'Content-Type': 'application/json',
                },
              });

              if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
              }

              const carData = await response.json();
              
              const updatedFormData = {
                ...formData,
                ...values,
                brand: carData.brand || '',
                model: carData.model || '',
                year: carData.year || '',
                chassisNumber: carData.chassisNumber || '',
                taxClass: carData.taxClass || '',
                fuel: carData.fuel || '',
                gearType: carData.gearType || '',
                driveType: carData.driveType || '',
                mainColor: carData.mainColor || '',
                power: carData.power || '',
                seats: carData.seats || '',
                owners: carData.owners || '',
                firstRegistration: carData.firstRegistration || '',
                doors: carData.doors || '',
                weight: carData.weight || '',
                co2: carData.co2 || '',
                omregistreringsavgift: carData.omregistreringsavgift || '',
                lastEUApproval: carData.lastEUApproval || '',
                nextEUControl: carData.nextEUControl || '',
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
