import React, { useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import './Step4.css';
import Header from './Header';
import Footer from './Footer';

const Step4 = ({ formData, setFormData, nextStep, prevStep }) => {
    const [previewImages, setPreviewImages] = useState(formData.previewImages || []); // Forhåndsviste bilder

    const validationSchema = Yup.object({
        description: Yup.string().required('Beskrivelse er påkrevd'),
        conditionDescription: Yup.string().required('Beskrivelse av egenerklæring/tilstand er påkrevd'),
        images: Yup.array().min(1, 'Minst ett bilde er påkrevd')
    });

    // Håndter opplastning av bilder fra PC-en
    const handleImageChange = async (event, setFieldValue) => {
        const files = Array.from(event.target.files); // Hent ut filene
        const previews = await Promise.all(files.map(file => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file); // Konverter til base64
                reader.onload = () => resolve(reader.result);
                reader.onerror = error => reject(error);
            });
        }));
        const updatedImages = [...(formData.images || []), ...files]; // Legg til nye filer
        const updatedPreviews = [...previewImages, ...previews]; // Legg til nye forhåndsvisninger

        setFieldValue('images', updatedImages); // Oppdater formdata
        setPreviewImages(updatedPreviews);
        setFormData({ ...formData, images: updatedImages, previewImages: updatedPreviews });
    };

    // Flytt bilder opp eller ned
    const moveImage = (index, direction) => {
        const newPreviews = [...previewImages];
        const newIndex = index + direction;

        if (newIndex >= 0 && newIndex < newPreviews.length) {
            [newPreviews[index], newPreviews[newIndex]] = [newPreviews[newIndex], newPreviews[index]]; // Bytt plass
            setPreviewImages(newPreviews);
            setFormData({ ...formData, previewImages: newPreviews });
        }
    };

    // Fjern et bilde
    const removeImage = (index, setFieldValue) => {
        const updatedPreviews = [...previewImages];
        updatedPreviews.splice(index, 1);

        const updatedImages = [...formData.images];
        updatedImages.splice(index, 1);

        setPreviewImages(updatedPreviews);
        setFieldValue('images', updatedImages);
        setFormData({ ...formData, images: updatedImages, previewImages: updatedPreviews });
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
                                    {previewImages.map((src, index) => (
                                        <div key={index} className="image-preview">
                                            <img src={src} alt={`Preview ${index}`} />
                                            <div className="image-controls">
                                                <button
                                                    type="button"
                                                    onClick={() => moveImage(index, -1)}
                                                    disabled={index === 0}
                                                >
                                                    Opp
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => moveImage(index, 1)}
                                                    disabled={index === previewImages.length - 1}
                                                >
                                                    Ned
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        removeImage(index, setFieldValue);
                                                    }}
                                                >
                                                    Fjern
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    <label htmlFor="images" className="step4-image-upload-label">
                                        <i className="material-icons">add</i>
                                        <input
                                            type="file"
                                            id="images"
                                            name="images"
                                            onChange={(event) => handleImageChange(event, setFieldValue)}
                                            className="step4-control"
                                            multiple
                                        />
                                    </label>
                                </div>
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
