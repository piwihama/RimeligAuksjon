import React, { useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import './Step4.css';
import Header from './Header';
import Footer from './Footer';

const Step4 = ({ formData, setFormData, nextStep, prevStep }) => {
    const [previewImages, setPreviewImages] = useState(formData.previewImages || []);
    const [modalImage, setModalImage] = useState(null); // State to handle modal image display

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

    const openModal = (image) => {
        setModalImage(image);
    };

    const closeModal = () => {
        setModalImage(null);
    };

    const handleOnDragEnd = (result, setFieldValue) => {
        if (!result.destination) return;
        const items = Array.from(previewImages);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        setPreviewImages(items);
        setFieldValue('images', items);
        setFormData({ ...formData, images: items, previewImages: items });
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
                                    <DragDropContext onDragEnd={(result) => handleOnDragEnd(result, setFieldValue)}>
                                        <Droppable droppableId="images">
                                            {(provided) => (
                                                <div {...provided.droppableProps} ref={provided.innerRef} className="image-list-container">
                                                    {previewImages.map((src, index) => (
                                                        <Draggable key={index} draggableId={`image-${index}`} index={index}>
                                                            {(provided) => (
                                                                <div
                                                                    className="image-preview"
                                                                    {...provided.draggableProps}
                                                                    {...provided.dragHandleProps}
                                                                    ref={provided.innerRef}
                                                                    onClick={() => openModal(src)}
                                                                >
                                                                    <img src={src} alt={`Preview ${index}`} />
                                                                    <span className="remove-icon" onClick={(e) => {
                                                                        e.stopPropagation(); // Prevent opening modal on remove click
                                                                        removeImage(index, setFieldValue);
                                                                    }}>×</span>
                                                                </div>
                                                            )}
                                                        </Draggable>
                                                    ))}
                                                    {provided.placeholder}
                                                </div>
                                            )}
                                        </Droppable>
                                    </DragDropContext>
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

            {/* Modal */}
            {modalImage && (
                <div className="modal" style={{ display: 'block' }} onClick={closeModal}>
                    <span className="close" onClick={closeModal}>&times;</span>
                    <div className="modal-content">
                        <img src={modalImage} alt="Full screen preview" />
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
};

export default Step4;
