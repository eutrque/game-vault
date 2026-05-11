import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Form, Button, Card } from 'react-bootstrap';

const Recuperar = () => {
    
    // Estado para capturar el correo
    const [email, setEmail] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Petición al backend para solicitar el correo de recuperación
            const res = await axios.post('http://localhost:3000/api/auth/forgot-password', { email });
            
            alert(res.data); 
            setEmail(''); // Limpiamos el campo

        } catch (error) {
            if (error.response && error.response.data) {
                alert("Error: " + error.response.data); 
            } else {
                alert("Hubo un error de conexión con el servidor.");
            }
        }
    };

    return (
        <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
            <Row className="w-100 justify-content-center">
                <Col xs={12} sm={8} md={6} lg={5} xl={4}>
                    <Card className="p-4 shadow-lg border-0" style={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.12)', 
                        backdropFilter: 'blur(20px)',
                        borderRadius: '25px',
                        border: '1px solid rgba(255, 255, 255, 0.25) !important'
                    }}>
                        <Card.Body>
                            <div className="text-center mb-4">
                                <h1 className="fw-bold mb-1" style={{ fontSize: '2.2rem', color: '#fff', letterSpacing: '-1px' }}>
                                    Recuperar contraseña
                                </h1>
                                <p style={{ color: '#ffffff', opacity: '0.9', fontSize: '0.95rem', fontWeight: '500' }}>
                                    Introduce tu correo para enviarte un enlace de recuperación
                                </p>
                            </div>

                            <Form onSubmit={handleSubmit}>
                                <Form.Group className="mb-4">
                                    <Form.Label className="text-white small fw-bold">Correo electrónico</Form.Label>
                                    <Form.Control
                                        type="email"
                                        placeholder="nombre@ejemplo.com"
                                        style={{ 
                                            backgroundColor: '#2a2a2a', 
                                            color: '#fff', 
                                            border: '1px solid #555',
                                            borderRadius: '12px',
                                            padding: '12px'
                                        }}
                                        className="shadow-none"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </Form.Group>

                                <Button 
                                    type="submit" 
                                    className="w-100 py-2 fw-bold border-0" 
                                    style={{ 
                                        backgroundColor: '#C084FC', 
                                        color: '#000', 
                                        borderRadius: '12px',
                                        fontSize: '1.1rem',
                                        boxShadow: '0 4px 15px rgba(192, 132, 252, 0.4)'
                                    }}
                                >
                                    Enviar enlace
                                </Button>
                            </Form>

                            <div className="text-center mt-4">
                                <p style={{ color: '#ffffff', opacity: '0.9', fontSize: '0.95rem' }}>
                                    <Link to="/login" style={{ color: '#C084FC' }} className="text-decoration-none fw-bold">
                                        Volver a iniciar sesión
                                    </Link>
                                </p>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default Recuperar;