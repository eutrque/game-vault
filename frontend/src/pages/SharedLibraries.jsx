import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Badge, Spinner } from 'react-bootstrap';
import axios from 'axios';

const SharedLibraries = () => {
    // Pillamos el ID de la biblioteca de la URL 
    const { libraryId } = useParams(); 
    const navigate = useNavigate();
    const API_URL = "http://localhost:3000";

    // Estados para el contenido del amigo
    const [activeTab, setActiveTab] = useState('games'); 
    const [data, setData] = useState({ owner: null, games: [], mangas: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchContent = async () => {
            try {
                // Llamamos al servidor para que nos dé los juegos de este ID específico
                const res = await axios.get(`${API_URL}/api/shared/content/${libraryId}`);
                setData(res.data);
            } catch (err) {
                console.error("Error al cargar la bóveda del amigo:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchContent();
    }, [libraryId, API_URL]);

    if (loading) {
        return (
            <div className="gv-library-wrapper d-flex align-items-center justify-content-center" style={{minHeight: '100vh'}}>
                <Spinner animation="border" variant="primary" />
            </div>
        );
    }

    // Filtramos qué lista mostrar según la pestaña activa
    const currentItems = activeTab === 'games' ? data.games : data.mangas;

    return (
        <div className="gv-library-wrapper pt-4 pb-5">
            <Container style={{ maxWidth: '1450px' }}>
                
                {/* Botón para retroceder a nuestra biblioteca */}
                <button onClick={() => navigate(-1)} className="btn text-white-50 mb-4 p-0">
                    <i className="bi bi-arrow-left me-2"></i> Volver a mi colección
                </button>

                <div className="d-flex align-items-center mb-4">
                     <i className="bi bi-shield-lock-fill me-3" style={{color: '#c084fc', fontSize: '2rem'}}></i>
                     <h2 className="text-white fw-bold m-0">Biblioteca de {data.owner?.nickname || 'Amigo'}</h2>
                </div>

                {/* Selector de contenido (Juegos o Mangas ) */}
                <div className="gv-library-tabs-container mb-4">
                    <button className={`gv-library-tab ${activeTab === 'games' ? 'active' : ''}`} onClick={() => setActiveTab('games')}>
                        <i className="bi bi-controller me-2"></i>Juegos
                    </button>
                    <button className={`gv-library-tab ${activeTab === 'mangas' ? 'active' : ''}`} onClick={() => setActiveTab('mangas')}>
                        <i className="bi bi-book-half me-2"></i>Mangas
                    </button>
                </div>

                <Row className="g-4">
                    {currentItems.length > 0 ? currentItems.map(item => (
                        <Col key={item.game_id || item.manga_id} xs={12} sm={6} md={4} lg={3}>
                            <Card className="gv-library-card h-100">
                                <div className="gv-card-header">
                                    {/* Mapeo de estados para que no salgan en inglés (ej. pending -> Pendiente) */}
                                    <Badge className={`gv-badge-status ${item.status}`}>
                                        {
                                            item.status === 'playing' ? (activeTab === 'games' ? 'Jugando' : 'Leyendo') :
                                            item.status === 'completed' ? 'Completado' :
                                            item.status === 'abandoned' ? 'Abandonado' : 'Pendiente'
                                        }
                                    </Badge>
                                    <Card.Img src={`${API_URL}/images/${activeTab === 'games' ? 'games' : 'mangas'}/${item.image || item.cover_image}`} />
                                </div>
                                <Card.Body>
                                    <Card.Title className="gv-card-title text-truncate text-white">{item.title}</Card.Title>
                                    <div className="d-flex justify-content-between mt-2 text-muted small">
                                        <span><i className="bi bi-star-fill text-warning"></i> {item.personal_rating || '-'}</span>
                                        <span>{activeTab === 'games' ? `${item.hours_played}h` : `${item.volumes_read} tomos`}</span>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    )) : (
                        <Col className="text-center py-5">
                            <h4 className="text-muted">No hay nada en esta sección de la biblioteca.</h4>
                        </Col>
                    )}
                </Row>
            </Container>
        </div>
    );
};

export default SharedLibraries;