import React from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import './Step5.css'; 
import Header from './Header';
import Footer from './Footer';

const Step5 = ({ formData, setFormData, prevStep, nextStep }) => {
  const validationSchema = Yup.object().shape({
    auctionDuration: Yup.string().required('Vennligst velg hvor raskt du vil selge.'),
    reservePrice: Yup.number().min(0, 'Minstepris må være større enn eller lik 0'),
    auctionWithoutReserve: Yup.boolean(),
  });

  return (
    <div>
      <Header />
      <div className="step5-container">
        <Formik
          initialValues={{
            auctionDuration: formData.auctionDuration || '',
            reservePrice: formData.reservePrice || '',
            auctionWithoutReserve: formData.auctionWithoutReserve || false,
          }}
          validationSchema={validationSchema}
          onSubmit={(values) => {
            setFormData({ ...formData, ...values });
            nextStep();
          }}
        >
          {() => (
            <Form className="step5-form">
              <h2>Auksjonsinnstillinger</h2>
              <div className='step5-group'>
                <label htmlFor='auctionDuration'>Hvor raskt vil du selge?</label>
                <Field as='select' id='auctionDuration' name='auctionDuration' className='step5-control'>
                  <option value=''>Velg</option>
                  <option value='3'>3 dager</option>
                  <option value='5'>5 dager</option>
                  <option value='7'>7 dager</option>
                  <option value='10'>10 dager</option>
                </Field>
                <ErrorMessage name='auctionDuration' component='div' className='step5-error' />
              </div>
              
              <div className='step5-group'>
                <label>
                  <Field type='checkbox' name='auctionWithoutReserve' />
Jeg vil selge uten minstepris                  
                  <div className="tooltip1">
                    <span className="info-icon">?</span>
                    <span className="tooltiptext">Å selge uten minstepris betyr at varen din selges uansett hva høyeste bud blir. Dette kan være effektivt for å tiltrekke flere budgivere og øke konkurransen. Uten minstepris risikerer du imidlertid å selge for en lavere pris enn forventet. Dette er ideelt hvis du ønsker et raskt salg og er villig til å akseptere risikoen for et lavere sluttbud. Vurder derfor nøye om denne strategien passer for deg før du velger å selge uten minstepris.






</span>
                  </div>
                </label>
                
              </div>
              <div className='step5-group'>
                <label htmlFor='reservePrice'>
                  Minstepris
                
                  <div className="tooltip1">
                    <span className="info-icon">?</span>
                    <span className="tooltiptext">Minstepris er den laveste prisen du er villig til å akseptere for varen din. </span>
                  </div>
                </label>
               
                <Field
                  type='number'
                  id='reservePrice'
                  name='reservePrice'
                  className='step5-control'
                  placeholder='Minstepris'
                />
                <ErrorMessage name='reservePrice' component='div' className='step5-error' />
              </div>
              <div className='step5-navigation'>
                <button type='button' onClick={prevStep} className='step5-btn-primary'>
                  Tilbake
                </button>
                <button type='submit' className='step5-btn-primary'>
                  Neste
                </button>
              </div>
            </Form>
          )}
        </Formik>
        
      </div>
      <Footer />
    </div>
    
  );
};

export default Step5;
