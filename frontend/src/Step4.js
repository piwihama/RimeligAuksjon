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
        images: Yup.array().min(1, 'Minst ett bilde er påkrevd')
    });

    const handleImageChange = async (event, setFieldValue) => {
        const files = Array.from(event.target.files);
        const previews = await Promise.all(files.map(file => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => resolve(reader.result);
                reader.onerror = error => reject(error);
            });
        }));
        const allFiles = [...(formData.images || []), ...previews];
        const allPreviews = [...previewImages, ...previews];

        setFieldValue('images', allFiles);
        setPreviewImages(allPreviews);
        setFormData({ ...formData, images: allFiles, previewImages: allPreviews });
    };

    const removeImage = (index, setFieldValue) => {
        const newPreviews = [...previewImages];
        newPreviews.splice(index, 1);
        setPreviewImages(newPreviews);

        const newFiles = [...formData.images];
        newFiles.splice(index, 1);
        setFieldValue('images', newFiles);
        setFormData({ ...formData, images: newFiles, previewImages: newPreviews });
    };

    const moveImage = (index, direction) => {
        const newPreviews = [...previewImages];
        const newIndex = index + direction;

        if (newIndex >= 0 && newIndex < newPreviews.length) {
            // Bytt plass på bildene
            [newPreviews[index], newPreviews[newIndex]] = [newPreviews[newIndex], newPreviews[index]];
            setPreviewImages(newPreviews);
            setFormData({ ...formData, previewImages: newPreviews });
        }
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
                            <div className='step4-group'>
                                <label htmlFor='description'>Beskrivelse av det du skal selge</label>
                                <Field as='textarea' id='description' name='description' className='step4-control' />
                                <ErrorMessage name='description' component='div' className='step4-error' />
                            </div>
                            <div className='step4-group'>
                                <label htmlFor='conditionDescription'>Beskrivelse av egenerklæring / tilstand</label>
                                <Field as='textarea' id='conditionDescription' name='conditionDescription' className='step4-control' />
                                <ErrorMessage name='conditionDescription' component='div' className='step4-error' />
                            </div>
                            <div className='step4-group'>
                                <label htmlFor='images'>Bilder</label>
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
                                    <label htmlFor='images' className='step4-image-upload-label'>
                                        <i className='material-icons'>add</i>
                                        <input
                                            type='file'
                                            id='images'
                                            name='images'
                                            onChange={(event) => handleImageChange(event, setFieldValue)}
                                            className='step4-control'
                                            multiple
                                        />
                                    </label>
                                </div>
                                <ErrorMessage name='images' component='div' className='step4-error' />
                            </div>
                            <div className="step4-navigation">
                                <button type="button" onClick={prevStep} className="step4-btn-primary" style={{ padding: '8px 16px', margin: '10px 5px' }}>
                                    Tilbake
                                </button>
                                <button type="submit" className="step4-btn-primary" style={{ padding: '8px 16px', margin: '10px 5px' }}>
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
