import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Spinner } from 'react-bootstrap';
import axios from 'axios';

// Reutilizamos el CSS del autor para mantener la consistencia perfecta
import '../styles/MangaDetail.css'; 
import '../styles/AuthorDetail.css'; 

const PublisherDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const API_URL = "http://localhost:3000";

    const [publisher, setPublisher] = useState(null);
    const [mangas, setMangas] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        window.scrollTo(0, 0);
        const fetchPublisherData = async () => {
            setLoading(true);
            try {
                const pubRes = await axios.get(`${API_URL}/api/publishers/${id}`);
                setPublisher(pubRes.data);

                const mangasRes = await axios.get(`${API_URL}/api/mangas/publisher/${id}`);
                setMangas(mangasRes.data);
            } catch (err) {
                console.error("Error al cargar la editorial:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchPublisherData();
    }, [id, API_URL]);

    if (loading) return <div className="gv-author-wrapper d-flex justify-content-center pt-5"><Spinner animation="border" variant="primary" /></div>;
    if (!publisher) return <div className="text-white text-center py-5">Editorial no encontrada</div>;

    // Cálculo rápido de la nota media de los mangas de esta editorial
    const averageScore = mangas.length > 0 
        ? (mangas.reduce((acc, m) => acc + Number(m.score || 0), 0) / mangas.length).toFixed(1) 
        : '--';

    return (
        <div className="gv-author-wrapper">
            <Container className="pt-5 pb-5" style={{ maxWidth: '1300px' }}>
                
                {/* 1. CABECERA UNIFICADA */}
                <div className="gv-author-hero-block">
                    
                    {/* Renderizado condicional: Imagen si hay, Icono si no hay */}
                    {publisher.image_url ? (
                        <img 
                            src={`${API_URL}/images/publishers/${publisher.image_url}`} 
                            alt={publisher.name}
                            className="gv-author-avatar-img"
                            /* Object fit contain y padding para que los logos rectangulares encajen bien en el círculo */
                            style={{ objectFit: 'contain', padding: '20px', backgroundColor: 'white' }}
                            onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                        />
                    ) : (
                        <div className="gv-author-avatar-img d-flex justify-content-center align-items-center">
                            <i className="bi bi-building text-white" style={{ fontSize: '4rem' }}></i>
                        </div>
                    )}
                    
                    {/* Fallback oculto por si la imagen da error 404 */}
                    <div className="gv-author-avatar-img justify-content-center align-items-center" style={{ display: 'none' }}>
                        <i className="bi bi-building text-white" style={{ fontSize: '4rem' }}></i>
                    </div>
                    
                    <div className="gv-author-info">
                        <h1 className="gv-author-name">{publisher.name}</h1>
                        <p className="gv-author-role m-0">Editorial / Distribuidora</p>
                    </div>

                    <div className="gv-author-stats-box">
                        <div className="gv-stat-item">
                            <span className="gv-stat-value">{mangas.length}</span>
                            <span className="gv-stat-label">Obras Publicadas</span>
                        </div>
                        <div className="gv-stat-item">
                            <span className="gv-stat-value" style={{ color: '#ffb400' }}>
                                <i className="bi bi-star-fill me-2" style={{ fontSize: '1.5rem' }}></i>
                                {averageScore}
                            </span>
                            <span className="gv-stat-label">Nota Media</span>
                        </div>
                    </div>
                </div>

                {/* 2. DESCRIPCIÓN DE LA EDITORIAL */}
                <div className="gv-box mb-5">
                    <h3 className="gv-box-title">Sobre la Editorial</h3>
                    <p className="m-0" style={{ color: '#e0e0e0', textAlign: 'justify', whiteSpace: 'pre-line', fontSize: '1.05rem', lineHeight: '1.8' }}>
                        {publisher.description}
                    </p>
                </div>

                {/* 3. CATÁLOGO DE OBRAS */}
                <h3 className="text-white fw-bold mb-4">
                    <i className="bi bi-grid-3x3-gap-fill me-3" style={{ color: '#c084fc' }}></i>
                    Catálogo
                </h3>
                
                <Row className="g-4">
                    {mangas.length > 0 ? (
                        mangas.map(m => (
                            <Col key={m.id} xs={12} sm={6} md={4} lg={3}>
                                <div className="gv-dev-game-card h-100" onClick={() => navigate(`/mangas/${m.id}`)}>
                                    <img src={`${API_URL}/images/mangas/${m.cover_image}`} className="gv-dev-game-img" alt={m.title} />
                                    <div className="p-3">
                                        <p className="text-white fw-bold fs-6 text-truncate m-0">{m.title}</p>
                                        <div className="d-flex justify-content-between align-items-center mt-2">
                                            <span style={{ color: '#ffb400', fontWeight: 'bold', fontSize: '0.9rem' }}>
                                                ⭐ {Number(m.score).toFixed(1)}
                                            </span>
                                            <small className="text-muted fw-bold">{m.release_year}</small>
                                        </div>
                                    </div>
                                </div>
                            </Col>
                        ))
                    ) : (
                        <p className="text-muted fst-italic ps-3">No hay obras registradas para esta editorial.</p>
                    )}
                </Row>

            </Container>
        </div>
    );
};

export default PublisherDetail;