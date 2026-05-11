import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Form, Button, Card } from 'react-bootstrap';

const Register = () => {

    // Estados para almacenar los datos del nuevo usuario
    const [username, setUsername] = useState('');
    const [nickname, setNickname] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault(); 

        if (!username.trim() || !nickname.trim() || !email.trim() || !password.trim()) {
            alert("Atención: No puedes dejar campos en blanco");
            return; 
        }

        const validNameRegex = /^[a-zA-Z0-9_ ]+$/;
        if (!validNameRegex.test(username) || !validNameRegex.test(nickname)) {
            alert("El nombre y el nickname no pueden contener símbolos especiales.");
            return; 
        }

        try {
            // Envío de datos al endpoint de registro
            const res = await axios.post('http://localhost:3000/api/auth/register', { 
                username, 
                nickname, 
                email, 
                password 
            });
            
            alert(res.data); 

            // Limpiamos el formulario tras el registro con éxito
            setUsername('');
            setNickname('');
            setEmail('');
            setPassword('');
            
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
                <Col xs={12} sm={10} md={8} lg={6} xl={4}>
    
                    <Card className="p-4 shadow-lg border-0" style={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.12)', 
                        backdropFilter: 'blur(20px)',
                        borderRadius: '25px',
                        border: '1px solid rgba(255, 255, 255, 0.25) !important'
                    }}>
                        <Card.Body>
                            <div className="text-center mb-4">
                                <h1 className="fw-bold mb-1" style={{ fontSize: '2.5rem', color: '#fff', letterSpacing: '-1px' }}>
                                    Crear cuenta
                                </h1>
                                <p style={{ color: '#ffffff', opacity: '0.9', fontSize: '0.95rem', fontWeight: '500' }}>
                                    Únete a GameVault y gestiona tu colección
                                </p>
                            </div>

                            <Form onSubmit={handleSubmit}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="text-white small fw-bold">Nombre de usuario</Form.Label>
                                    <Form.Control 
                                        type="text" 
                                        placeholder="Tu nombre o usuario"
                                        style={{ 
                                            backgroundColor: '#2a2a2a', 
                                            color: '#fff', 
                                            border: '1px solid #555',
                                            borderRadius: '12px',
                                            padding: '12px'
                                        }}
                                        className="shadow-none"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)} 
                                        required 
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label className="text-white small fw-bold">Nickname</Form.Label>
                                    <Form.Control 
                                        type="text" 
                                        placeholder="Tu apodo público"
                                        style={{ 
                                            backgroundColor: '#2a2a2a', 
                                            color: '#fff', 
                                            border: '1px solid #555',
                                            borderRadius: '12px',
                                            padding: '12px'
                                        }}
                                        className="shadow-none"
                                        value={nickname}
                                        onChange={(e) => setNickname(e.target.value)} 
                                        required 
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
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

                                <Form.Group className="mb-4">
                                    <Form.Label className="text-white small fw-bold">Contraseña</Form.Label>
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
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)} 
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
                                    Crear cuenta
                                </Button>
                            </Form>

                            <div className="text-center mt-4">
                                <p style={{ color: '#ffffff', opacity: '0.9', fontSize: '0.95rem' }}>
                                    ¿Ya tienes cuenta?{' '}
                                    <Link to="/login" style={{ color: '#C084FC' }} className="text-decoration-none fw-bold">
                                        Inicia sesión
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

export default Register;