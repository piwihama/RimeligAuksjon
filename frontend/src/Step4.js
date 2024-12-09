import React, { useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import { Sortable, MultiDrag, Swap } from 'sortablejs';
import * as Yup from 'yup';
import './Step4.css';
import Header from './Header';
import Footer from './Footer';

Sortable.mount(new MultiDrag(), new Swap());

const Step4 = ({ formData, setFormData, nextStep, prevStep }) => {
  const [previewImages, setPreviewImages] = useState(formData.previewImages || []);

  const validationSchema = Yup.object({
    description: Yup.string().required('Beskrivelse er påkrevd'),
    conditionDescription: Yup.string().required('Beskrivelse av egenerklæring/tilstand er påkrevd'),
    images: Yup.array().min(1, 'Minst ett bilde er påkrevd'),
  });

  const handleImageUpload = async (event, setFieldValue) => {
    const files = Array.from(event.target.files);

    if (files.length === 0) return;

    try {
      const newImages = await Promise.all(
        files.map((file) =>
          new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve({ id: file.name, src: reader.result });
            reader.onerror = (error) => reject(error);
            reader.readAsDataURL(file);
          })
        )
      );

      const updatedImages = [...previewImages, ...newImages];
      setPreviewImages(updatedImages);
      setFieldValue(
        'images',
        updatedImages.map((image) => image.src)
      );
      setFormData({ ...formData, previewImages: updatedImages });
    } catch (error) {
      console.error('Feil ved opplasting av bilder:', error);
    }
  };

  const handleDeleteImage = (index, setFieldValue) => {
    const updatedImages = previewImages.filter((_, i) => i !== index);
    setPreviewImages(updatedImages);
    setFieldValue(
      'images',
      updatedImages.map((image) => image.src)
    );
    setFormData({ ...formData, previewImages: updatedImages });
  };

  const handleSort = (event) => {
    const items = Array.from(event.to.children);
    const sortedImages = items.map((item) =>
      previewImages.find((image) => image.id === item.dataset.id)
    );
    setPreviewImages(sortedImages);
    setFormData({ ...formData, previewImages: sortedImages });
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
                <label htmlFor="images">Last opp bilder</label>
                <div
                  className="step4-image-preview-container"
                  ref={(el) => {
                    if (el) {
                      new Sortable(el, {
                        animation: 150,
                        onEnd: handleSort,
                      });
                    }
                  }}
                >
                  {previewImages.map((image, index) => (
                    <div key={image.id} data-id={image.id} className="image-preview">
                      <img src={image.src} alt={`Preview ${index}`} />
                      <button
                        type="button"
                        className="delete-button"
                        onClick={() => handleDeleteImage(index, setFieldValue)}
                      >
                        Slett
                      </button>
                    </div>
                  ))}
                </div>
                <label htmlFor="images" className="step4-image-upload-label">
                  <input
                    type="file"
                    id="images"
                    name="images"
                    onChange={(event) => handleImageUpload(event, setFieldValue)}
                    multiple
                    accept="image/*"
                  />
                  Klikk for å laste opp bilder
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
