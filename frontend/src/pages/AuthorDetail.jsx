import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Spinner } from 'react-bootstrap';
import axios from 'axios';

import '../styles/MangaDetail.css'; 
import '../styles/AuthorDetail.css'; 

const AuthorDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const API_URL = "http://localhost:3000";

    const [author, setAuthor] = useState(null);
    const [mangas, setMangas] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        window.scrollTo(0, 0);
        const fetchAuthorData = async () => {
            setLoading(true);
            try {
                const authorRes = await axios.get(`${API_URL}/api/authors/${id}`);
                setAuthor(authorRes.data);

                const mangasRes = await axios.get(`${API_URL}/api/mangas/author/${id}`);
                setMangas(mangasRes.data);
            } catch (err) {
                console.error("Error al cargar el autor:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchAuthorData();
    }, [id, API_URL]);

    if (loading) return <div className="gv-author-wrapper d-flex justify-content-center pt-5"><Spinner animation="border" variant="primary" /></div>;
    if (!author) return <div className="text-white text-center py-5">Autor no encontrado</div>;

    // Calculamos la nota media para la cabecera
    const averageScore = mangas.length > 0 
        ? (mangas.reduce((acc, m) => acc + Number(m.score || 0), 0) / mangas.length).toFixed(1) 
        : '--';

    return (
        <div className="gv-author-wrapper">
            <Container className="pt-5 pb-5" style={{ maxWidth: '1300px' }}>
                
                {/* 1. BLOQUE PRINCIPAL (CABECERA) */}
                <div className="gv-author-hero-block">
                    <img 
                        src={`${API_URL}/images/authors/${author.image_url}`} 
                        alt={author.name}
                        className="gv-author-avatar-img"
                        onError={(e) => { e.target.src = `${API_URL}/images/authors/default.jpg` }}
                    />
                    
                    <div className="gv-author-info">
                        <h1 className="gv-author-name">{author.name}</h1>
                        <p className="gv-author-role m-0">Mangaka / Ilustrador Profesional</p>
                    </div>

                    <div className="gv-author-stats-box">
                        <div className="gv-stat-item">
                            <span className="gv-stat-value">{mangas.length}</span>
                            <span className="gv-stat-label">Obras</span>
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

                {/* 2. BLOQUE BIOGRAFÍA */}
                <div className="gv-box mb-5">
                    <h3 className="gv-box-title">Biografía</h3>
                    <p className="m-0" style={{ color: '#e0e0e0', textAlign: 'justify', whiteSpace: 'pre-line', fontSize: '1.05rem', lineHeight: '1.8' }}>
                        {author.biography || "La biografía de este autor está pendiente de actualización."}
                    </p>
                </div>

                {/* 3. BLOQUE OBRAS */}
                <h3 className="text-white fw-bold mb-4">
                    <i className="bi bi-journal-bookmark-fill me-3" style={{ color: '#c084fc' }}></i>
                    Bibliografía
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
                        <p className="text-muted fst-italic ps-3">No hay obras registradas para este autor.</p>
                    )}
                </Row>

            </Container>
        </div>
    );
};

export default AuthorDetail;