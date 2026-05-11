import React, { useState } from 'react';
import { Container, Row, Col, Form } from 'react-bootstrap';
import '../styles/Contact.css';

const Contact = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        message: ''
    });

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        alert(`¡Gracias por contactarnos, ${formData.name}! Hemos recibido tu mensaje y te responderemos pronto !`);
        setFormData({ name: '', email: '', message: '' });
    };

    return (
        <div className="gv-contact-wrapper py-5">
            <Container className="pt-4 pb-5">
                <Row className="align-items-center justify-content-between g-5">
                    
                    {/* COLUMNA IZQUIERDA: Textos e Información */}
                    <Col lg={5} className="mb-5 mb-lg-0">
                        <h2 className="gv-contact-title mb-3">Contacto y Soporte</h2>
                        <p className="gv-contact-subtitle mb-5">
                            ¿Dudas con tu biblioteca de juegos, sugerencias para mejorar la plataforma o necesitas ayuda con tu cuenta? Nuestro equipo está a un clic de distancia.
                        </p>

                        <div className="d-flex flex-column gap-5">
                            {/* Info 1: Escríbenos */}
                            <div className="d-flex align-items-start gap-4 gv-info-item">
                                <div className="gv-info-icon">
                                    <i className="bi bi-envelope-paper-heart"></i>
                                </div>
                                <div>
                                    <h5 className="text-white fw-bold mb-1">Escríbenos</h5>
                                    <p className="gv-text-light mb-3 small">Soporte técnico y atención al cliente.</p>
                                    <div className="d-flex flex-column gap-1">
                                        <a href="mailto:estelautrera@gmail.com" className="gv-contact-link">soporte@gamevault.pro</a>
                                        <a href="mailto:estelautrera@gmail.com" className="gv-contact-link" style={{fontSize: '0.95rem', opacity: '0.85'}}>info@gamevault.pro</a>
                                    </div>
                                </div>
                            </div>

                            {/* Info 2: Visítanos */}
                            <div className="d-flex align-items-start gap-4 gv-info-item">
                                <div className="gv-info-icon">
                                    <i className="bi bi-geo-alt"></i>
                                </div>
                                <div>
                                    <h5 className="text-white fw-bold mb-1">Visítanos</h5>
                                    <p className="gv-text-light mb-2 small">Nuestras oficinas centrales.</p>
                                    <address className="gv-contact-address m-0">
                                        Calle de la Innovación, S/N<br />
                                        Campus Tecnológico de Linares<br />
                                        <span className="text-white fw-bold">23700 Linares (Jaén)</span>
                                    </address>
                                </div>
                            </div>
                        </div>
                    </Col>

                    {/* COLUMNA DERECHA: Formulario Destacado */}
                    <Col lg={6}>
                        <div className="gv-contact-form-container">
                            <h3 className="text-white fw-bold mb-4">Envíanos un mensaje</h3>
                            <Form onSubmit={handleSubmit}>
                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-4">
                                            <Form.Label className="gv-form-label-contact">Tu Nombre</Form.Label>
                                            <Form.Control 
                                                type="text" 
                                                name="name" 
                                                className="gv-input-contact" 
                                                placeholder="Ej: Alex" 
                                                value={formData.name} 
                                                onChange={handleInputChange} 
                                                required 
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-4">
                                            <Form.Label className="gv-form-label-contact">Tu Correo</Form.Label>
                                            <Form.Control 
                                                type="email" 
                                                name="email" 
                                                className="gv-input-contact" 
                                                placeholder="Ej: alex@correo.com" 
                                                value={formData.email} 
                                                onChange={handleInputChange} 
                                                required 
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Form.Group className="mb-4">
                                    <Form.Label className="gv-form-label-contact">Mensaje</Form.Label>
                                    <Form.Control 
                                        as="textarea" 
                                        rows={5} 
                                        name="message" 
                                        className="gv-input-contact" 
                                        placeholder="¿En qué podemos ayudarte?..." 
                                        value={formData.message} 
                                        onChange={handleInputChange} 
                                        required 
                                        style={{ resize: 'none' }} 
                                    />
                                </Form.Group>

                                <button type="submit" className="gv-btn-submit-contact w-100 mt-2">
                                    <i className="bi bi-send-fill me-2"></i> Enviar Mensaje
                                </button>
                            </Form>
                        </div>
                    </Col>
                </Row>
            </Container>
        </div>
    );
};

export default Contact;