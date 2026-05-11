import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Form, Button, Card } from 'react-bootstrap';

const ResetPassword = () => {

    // Estado para la nueva contraseña
    const [newPassword, setNewPassword] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Extraemos el token JWT directamente de la barra de direcciones (URL)
        const query = new URLSearchParams(window.location.search);
        const token = query.get('token');

        if (!token) {
            alert("Atención: No se ha encontrado un token válido en la URL.");
            return;
        }

        try {
            // Petición al backend enviando el token y la nueva clave
            const res = await axios.post('http://localhost:3000/api/auth/reset-password', { 
                token, 
                newPassword 
            });
            
            alert(res.data); 
            
            // Si todo va bien, redirigimos al usuario al Login
            navigate('/login');

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
                                    Nueva contraseña
                                </h1>
                                <p style={{ color: '#ffffff', opacity: '0.9', fontSize: '0.95rem', fontWeight: '500' }}>
                                    Escribe tu nueva clave de acceso
                                </p>
                            </div>

                            <Form onSubmit={handleSubmit}>
                                <Form.Group className="mb-4">
                                    <Form.Label className="text-white small fw-bold">Nueva contraseña</Form.Label>
                                    {/* INPUT: Gris ceniza neutro para visibilidad total */}
                                    <Form.Control
                                        type="password"
                                        placeholder="••••••••"
                                        style={{ 
                                            backgroundColor: '#2a2a2a', 
                                            color: '#fff', 
                                            border: '1px solid #555',
                                            borderRadius: '12px',
                                            padding: '12px'
                                        }}
                                        className="shadow-none"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
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
                                    Guardar contraseña
                                </Button>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default ResetPassword;