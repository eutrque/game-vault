import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import '../styles/Footer.css';

const Footer = () => {
    return (
        <footer className="gv-footer">
            <Container>
                <Row className="align-items-center">
                    {/* Izquierda: Logo + Frase descriptiva */}
                    <Col md={5} className="text-center text-md-start">
                        <div className="footer-brand">
                            <i className="bi bi-controller me-2"></i>
                            <span>GAME<span>VAULT</span></span>
                        </div>
                        <p className="footer-tagline mt-2">
                            Tu biblioteca personal de videojuegos, <br /> 
                            organizada y siempre contigo.
                        </p>
                    </Col>

                    {/* Derecha: Enlaces Morados */}
                    <Col md={7} className="text-center text-md-end mt-4 mt-md-0">
                        <div className="footer-nav-links">
                            <Link to="/about" className="footer-link">
                                <i className="bi bi-people me-2"></i>Quiénes somos
                            </Link>
                            
                            <span className="footer-separator">|</span>
                            
                            <Link to="/contact" className="footer-link">
                                <i className="bi bi-chat-dots me-2"></i>Contacto
                            </Link>
                            
                            <span className="footer-separator">|</span>
                            
                            <Link to="/privacy" className="footer-link">
                                <i className="bi bi-shield-lock me-2"></i>Privacidad
                            </Link>
                        </div>
                    </Col>
                </Row>
                
                <hr className="footer-divider" />
                
                <div className="footer-bottom text-center">
                    <p className="m-0">© 2026 GameVault - Hecho para coleccionistas</p>
                </div>
            </Container>
        </footer>
    );
};

export default Footer;