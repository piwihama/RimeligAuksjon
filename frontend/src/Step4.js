import React, { useState, useRef, useEffect } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import Sortable from 'sortablejs';
import * as Yup from 'yup';
import './Step4.css';
import Header from './Header';
import Footer from './Footer';

const Step4 = ({ formData, setFormData, nextStep, prevStep }) => {
  const [previewImages, setPreviewImages] = useState(formData.previewImages || []);
  const sortableContainerRef = useRef(null);
  const [key, setKey] = useState(0); // For å tvinge rerender etter endringer

  const validationSchema = Yup.object({
    description: Yup.string().required('Beskrivelse er påkrevd'),
    conditionDescription: Yup.string().required('Beskrivelse av egenerklæring/tilstand er påkrevd'),
    images: Yup.array().min(1, 'Minst ett bilde er påkrevd'),
  });

  useEffect(() => {
    setFormData((prevData) => ({ ...prevData, previewImages }));
  }, [previewImages, setFormData]);

  useEffect(() => {
    if (sortableContainerRef.current) {
      Sortable.create(sortableContainerRef.current, {
        animation: 150,
        handle: '.step4-drag-handle',
        onEnd: (evt) => {
          if (evt.oldIndex === undefined || evt.newIndex === undefined) return;

          const newOrder = Array.from(previewImages);
          const [movedItem] = newOrder.splice(evt.oldIndex, 1);

          if (movedItem) {
            newOrder.splice(evt.newIndex, 0, movedItem);
            setPreviewImages(newOrder);
            setKey((prevKey) => prevKey + 1); // Tving rerender
          }
        },
      });
    }
  }, [previewImages]);

  const handleImageUpload = async (event, setFieldValue) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    try {
      const newImages = await Promise.all(
        files.map((file) =>
          new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve({ id: `${file.name}-${Date.now()}`, src: reader.result });
            reader.onerror = (error) => reject(error);
            reader.readAsDataURL(file);
          })
        )
      );

      const updatedImages = [...previewImages, ...newImages];
      setPreviewImages(updatedImages);
      setFieldValue('images', updatedImages.map((image) => image.src));
      setFormData({ ...formData, previewImages: updatedImages });
    } catch (error) {
      console.error('Feil ved opplasting av bilder:', error);
    }
  };

  const handleDeleteImage = (index, setFieldValue) => {
    const updatedImages = previewImages.filter((_, i) => i !== index);
    setPreviewImages(updatedImages);
    setFieldValue('images', updatedImages.map((image) => image.src));
    setFormData({ ...formData, previewImages: updatedImages });
    setKey((prevKey) => prevKey + 1); // Tving rerender
  };

  const moveImageUp = (index) => {
    if (index === 0) return;
    const reorderedImages = [...previewImages];
    [reorderedImages[index - 1], reorderedImages[index]] = [reorderedImages[index], reorderedImages[index - 1]];
    setPreviewImages(reorderedImages);
    setFormData({ ...formData, previewImages: reorderedImages });
    setKey((prevKey) => prevKey + 1);
  };

  const moveImageDown = (index) => {
    if (index === previewImages.length - 1) return;
    const reorderedImages = [...previewImages];
    [reorderedImages[index + 1], reorderedImages[index]] = [reorderedImages[index], reorderedImages[index + 1]];
    setPreviewImages(reorderedImages);
    setFormData({ ...formData, previewImages: reorderedImages });
    setKey((prevKey) => prevKey + 1);
  };

  return (
    <div>
      <Header />
      <div className="step4-container">
        <Formik
          initialValues={{ ...formData, images: previewImages.map((image) => image.src) }}
          enableReinitialize
          validationSchema={validationSchema}
          onSubmit={(values) => {
            setFormData({ ...values, previewImages });
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
                <div ref={sortableContainerRef} key={key} className="step4-image-preview-container">
                  {previewImages.map((image, index) => (
                    <div key={image.id} data-id={image.id} className="step4-image-preview">
                      <span className="step4-drag-handle">☰</span>
                      <img src={image.src} alt={`Preview ${index}`} />
                      <div className="step4-button-container">
                        <button type="button" onClick={() => moveImageUp(index)} disabled={index === 0}>
                          Opp
                        </button>
                        <button type="button" onClick={() => moveImageDown(index)} disabled={index === previewImages.length - 1}>
                          Ned
                        </button>
                        <button type="button" onClick={() => handleDeleteImage(index, setFieldValue)}>
                          Slett
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <input
                  type="file"
                  id="images"
                  name="images"
                  onChange={(event) => handleImageUpload(event, setFieldValue)}
                  multiple
                  accept="image/*"
                />
                <ErrorMessage name="images" component="div" className="step4-error" />
              </div>

              <div className="step4-navigation">
                <button
                  type="button"
                  onClick={() => { setFormData({ ...formData, previewImages }); prevStep(); }}
                  className="step4-btn-primary"
                >
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
