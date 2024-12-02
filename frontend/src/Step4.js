import React, { useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import './Step4.css';
import Header from './Header';
import Footer from './Footer';

const Step4 = ({ formData, setFormData, nextStep, prevStep }) => {
  const [previewImages, setPreviewImages] = useState(formData.previewImages || []);

  const validationSchema = Yup.object({
    description: Yup.string().required('Beskrivelse er påkrevd'),
    conditionDescription: Yup.string().required('Beskrivelse av egenerklæring/tilstand er påkrevd'),
    images: Yup.array().min(1, 'Minst ett bilde er påkrevd'),
  });

  // Håndter bildeopplasting
  const handleImageUpload = async (event, setFieldValue) => {
    const files = Array.from(event.target.files);
    const newImages = await Promise.all(
      files.map((file) =>
        new Promise((resolve) => {
          const reader = new FileReader();
          reader.readAsDataURL(file); // Konverter til base64
          reader.readAsDataURL(file);
          reader.onload = () => resolve({ id: file.name, src: reader.result });
        })
      )
    );

    const updatedImages = [...previewImages, ...newImages];
    setPreviewImages(updatedImages);
    setFieldValue('images', updatedImages.map((image) => image.src));
    setFormData({ ...formData, previewImages: updatedImages });
  };

  // Flytt bilder opp
  const moveImageUp = (index) => {
    if (index === 0) return; // Kan ikke flyttes opp hvis det allerede er på toppen
    const reorderedImages = [...previewImages];
    [reorderedImages[index - 1], reorderedImages[index]] = [reorderedImages[index], reorderedImages[index - 1]];
    setPreviewImages(reorderedImages);
    setFormData({ ...formData, previewImages: reorderedImages });
  };

  // Flytt bilder ned
  const moveImageDown = (index) => {
    if (index === previewImages.length - 1) return; // Kan ikke flyttes ned hvis det allerede er nederst
    const reorderedImages = [...previewImages];
    [reorderedImages[index + 1], reorderedImages[index]] = [reorderedImages[index], reorderedImages[index + 1]];
    setPreviewImages(reorderedImages);
    setFormData({ ...formData, previewImages: reorderedImages });
  };

  // Flytt bilde til toppen
  const moveImageToTop = (index) => {
    if (index === 0) return;
    const reorderedImages = [...previewImages];
    const [image] = reorderedImages.splice(index, 1);
    reorderedImages.unshift(image);
    setPreviewImages(reorderedImages);
    setFormData({ ...formData, previewImages: reorderedImages });
  };

  // Flytt bilde til bunnen
  const moveImageToBottom = (index) => {
    if (index === previewImages.length - 1) return;
    const reorderedImages = [...previewImages];
    const [image] = reorderedImages.splice(index, 1);
    reorderedImages.push(image);
    setPreviewImages(reorderedImages);
    setFormData({ ...formData, previewImages: reorderedImages });
  };

  // Håndter sletting av bilder
  const handleDeleteImage = (index, setFieldValue) => {
    const updatedImages = previewImages.filter((_, i) => i !== index);
    setPreviewImages(updatedImages);
    setFieldValue('images', updatedImages.map((image) => image.src));
    setFormData({ ...formData, previewImages: updatedImages });
  };

  return (
    <div>
      <Header />
      <div className="step4-container">
        <Formik
          initialValues={formData}
          validationSchema={validationSchema}
          onSubmit={(values) => {
            setFormData({ ...formData, ...values });
            nextStep();
          }}
        >
          {({ setFieldValue }) => (
            <Form className="step4-form">
              <h2>Detaljer om Auksjon</h2>
              <div className="step4-group">
                <label htmlFor="description">Beskrivelse av det du skal selge</label>
                <Field as="textarea" id="description" name="description" className="step4-control" />
                <ErrorMessage name="description" component="div" className="step4-error" />
              </div>
              <div className="step4-group">
                <label htmlFor="conditionDescription">Beskrivelse av egenerklæring / tilstand</label>
                <Field as="textarea" id="conditionDescription" name="conditionDescription" className="step4-control" />
                <ErrorMessage name="conditionDescription" component="div" className="step4-error" />
              </div>
              <div className="step4-group">
                <label htmlFor="images">Bilder</label>
                <div className="step4-image-preview-container">
                  {previewImages.map((image, index) => (
                    <div key={image.id} className="image-preview">
                      <img src={image.src} alt={`Preview ${index}`} />
            
                      <div className="button-container">
                        <button
                          type="button"
                          onClick={() => moveImageToTop(index)}
                          disabled={index === 0}
                          title="Flytt til toppen"
                        >
                          ⬆⬆
                        </button>
                        <button
                          type="button"
                          onClick={() => moveImageUp(index)}
                          disabled={index === 0}
                          title="Flytt opp"
                        >
                          ⬆
                        </button>
                        <button
                          type="button"
                          onClick={() => moveImageDown(index)}
                          disabled={index === previewImages.length - 1}
                          title="Flytt ned"
                        >
                          ⬇
                        </button>
                        <button
                          type="button"
                          onClick={() => moveImageToBottom(index)}
                          disabled={index === previewImages.length - 1}
                          title="Flytt til bunnen"
                        >


                          ⬇⬇
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteImage(index, setFieldValue)}
                          title="Slett bilde"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <label htmlFor="images" className="step4-image-upload-label">
                  <input
                    type="file"
                    id="images"
                    name="images"
                    onChange={(event) => handleImageUpload(event, setFieldValue)}
                    className="step4-control"
                    multiple
                    accept="image/*"
                  />
                  Last opp bilder
                </label>
                <ErrorMessage name="images" component="div" className="step4-error" />
              </div>
              <div className="step4-navigation">

                
                <button type="button" onClick={prevStep} className="step4-btn-primary">
                  Tilbake
                </button>

                <button type="submit" className="step4-btn-primary">
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

export default Step4;
