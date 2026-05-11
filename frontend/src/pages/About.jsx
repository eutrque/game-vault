import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import '../styles/About.css';

const About = () => {
    return (
        <div className="gv-about-section">
            <Container className="py-5">
                <h1 className="gv-about-title mb-5">SOBRE <span className="text-purple">GAMEVAULT</span></h1>

                <Row className="gy-5 align-items-center">
                    <Col lg={7}>
                        <div className="gv-about-main-content">
                            <h2 className="text-white mb-4 fw-bold">Tu colección, organizada como nunca</h2>
                            <p className="gv-about-p">
                                GameVault nació con una idea sencilla: crear el rincón definitivo para gestionar tu biblioteca de juegos. No importa si juegas en PC, en la última consola o en sistemas clásicos; aquí centralizamos toda tu actividad en una interfaz limpia y adaptada a ti.
                            </p>
                            <p className="gv-about-p">
                                Nos tomamos en serio la autenticidad de nuestra comunidad. Por eso, hemos implementado un <strong>sistema de activación por correo electrónico</strong> que garantiza que cada perfil sea real y seguro desde el primer minuto. Además, nuestro motor procesa cada cambio en tu biblioteca para ofrecerte estadísticas exactas sobre tu progreso y las horas que dedicas a tu pasión.
                            </p>
                        </div>
                    </Col>

                    <Col lg={5} className="ps-lg-5">
                        <div className="gv-about-list">
                            <div className="gv-about-item">
                                <div className="gv-about-icon"><i className="bi bi-person-check-fill"></i></div>
                                <div>
                                    <h5>Cuentas Verificadas</h5>
                                    <span>Seguridad desde el registro con validación por email para una comunidad auténtica.</span>
                                </div>
                            </div>
                            <div className="gv-about-item">
                                <div className="gv-about-icon"><i className="bi bi-bar-chart-fill"></i></div>
                                <div>
                                    <h5>Tu progreso al detalle</h5>
                                    <span>Visualiza tus estadísticas, horas acumuladas y juegos completados al instante.</span>
                                </div>
                            </div>
                            <div className="gv-about-item">
                                <div className="gv-about-icon"><i className="bi bi-funnel-fill"></i></div>
                                <div>
                                    <h5>Buscador Avanzado</h5>
                                    <span>Encuentra lo que buscas combinando filtros de género, desarrolladores y fechas de salida.</span>
                                </div>
                            </div>
                        </div>
                    </Col>
                </Row>
            </Container>
        </div>
    );
};

export default About;