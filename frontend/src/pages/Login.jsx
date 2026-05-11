import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Form, Button, Card } from 'react-bootstrap';

const Login = () => {

    // Estados para capturar los campos del formulario
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

   const handleSubmit = async (e) => {
    e.preventDefault();
    try {
        const res = await axios.post('http://localhost:3000/api/auth/login', { 
            email, 
            password 
        });
        
        // Guardamos el TOKEN
        localStorage.setItem('token', res.data.token);

        // Guardamos los datos que el navBar necesita
        if (res.data.user) {
            localStorage.setItem('userId', res.data.user.id);
            localStorage.setItem('nickname', res.data.user.nickname);
            localStorage.setItem('avatar_img', res.data.user.avatar_img);
            
            // Guardamos el rol para saber si es admin, moderador o user
            localStorage.setItem('userRole', res.data.user.role); 
        }

        setEmail('');  
        setPassword(''); 
        
        // Redirigimos a home
        navigate('/home');

    } catch (error) {
        if (!error.response) {
            alert("No se pudo conectar con el servidor.");
        } else {
            alert("Error: " + (error.response.data.message || error.response.data));
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
                                <h1 className="gv-logo fw-bold mb-1" style={{ fontSize: '2.5rem', color: '#fff' }}>GameVault</h1>
                                <p style={{ color: '#ffffff', opacity: '0.9', fontSize: '0.95rem', fontWeight: '500' }}>
                                    Gestiona tu colección de videojuegos
                                </p>
                            </div>

                            <Form onSubmit={handleSubmit}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="text-white small fw-bold">Correo Electrónico</Form.Label>
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
                                        className="shadow-none custom-input"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </Form.Group>

                                <Form.Group className="mb-2">
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
                                        className="shadow-none custom-input"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </Form.Group>

                                <div className="text-end mb-4">
                                    <Link to="/forgot-password" style={{ color: '#C084FC', fontSize: '0.85rem' }} className="text-decoration-none fw-bold">
                                        ¿Has olvidado tu contraseña?
                                    </Link>
                                </div>

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
                                    Iniciar Sesión
                                </Button>
                            </Form>

                            <div className="text-center mt-4">
                                <p style={{ color: '#ffffff', opacity: '0.9', fontSize: '0.95rem' }}>
                                    ¿No tienes cuenta?{' '}
                                    <Link to="/register" style={{ color: '#C084FC' }} className="text-decoration-none fw-bold">
                                        Regístrate
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

export default Login;