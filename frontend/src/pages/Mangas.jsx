import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Badge, Form, Button, Spinner } from 'react-bootstrap';
import '../styles/Mangas.css'; 

const Mangas = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const API_URL = "http://localhost:3000";

    const [mangas, setMangas] = useState([]); 
    const [loading, setLoading] = useState(true);
    const [publishers, setPublishers] = useState([]); // Solo mantenemos editoriales para las píldoras

    const [aiPrompt, setAiPrompt] = useState(''); 
    const [isAiLoading, setIsAiLoading] = useState(false);

    // Cargar editoriales y catálogo
    useEffect(() => {
        const fetchData = async () => {
            try {
                const resPub = await axios.get(`${API_URL}/api/publishers`);
                setPublishers(resPub.data);
            } catch (err) {
                console.error("Error al cargar editoriales:", err);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        const fetchMangas = async () => {
            setLoading(true);
            try {
                const res = await axios.get(`${API_URL}/api/mangas`, {
                    params: Object.fromEntries([...searchParams])
                });
                setMangas(res.data);
            } catch (err) {
                console.error("Error al cargar el catálogo:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchMangas();
    }, [searchParams]);

    const handleFilterChange = (key, value) => {
        const newParams = new URLSearchParams(searchParams);
        if (value === 'Todos') {
            newParams.delete(key);
        } else {
            newParams.set(key, value);
        }
        setSearchParams(newParams);
    };

    const handleAiSearch = async (e) => {
        e.preventDefault(); 
        if (!aiPrompt.trim()) return;

        setIsAiLoading(true);
        try {
            const res = await axios.post(`${API_URL}/api/mangas/ai-search`, { prompt: aiPrompt });
            if (res.data && res.data.results) {
                setMangas(res.data.results);
            }
        } catch (err) {
            console.error("Error en la búsqueda con IA:", err);
        } finally {
            setIsAiLoading(false);
        }
    };

    return (
        <Container className="py-5">
            {/* Buscador Inteligente: Ajustado a la definición del tutor (Buscador directo) */}
            <div className="gv-ai-section gv-ai-glow mb-5 p-5 rounded-4 text-center">
                <h2 className="text-white mb-2 fw-bold">
                    <i className="bi bi-search-heart me-2" style={{color: '#a855f7'}}></i>
                    Buscador Inteligente de Mangas
                </h2>
                <p className="text-secondary mb-4">Escribe el título, género o temática que quieras encontrar en nuestro catálogo.</p>
                
                <Form onSubmit={handleAiSearch} className="d-flex justify-content-center">
                    <div className="position-relative w-75 gv-ai-search-box">
                        <Form.Control
                            type="text"
                            placeholder="Ej: One Piece, manga de terror, obras de Kentaro Miura..."
                            className="gv-ai-input py-3 px-4 rounded-pill"
                            value={aiPrompt}
                            onChange={(e) => setAiPrompt(e.target.value)}
                        />
                        <Button 
                            type="submit" 
                            className="gv-ai-btn position-absolute top-50 end-0 translate-middle-y me-2 rounded-pill fw-bold"
                            disabled={isAiLoading}
                        >
                            {isAiLoading ? <Spinner size="sm" /> : 'Buscar Manga'}
                        </Button>
                    </div>
                </Form>
            </div>

            {/* FILTROS: Editoriales centradas y minimalistas */}
            <div className="mb-5 text-center">
                <h6 className="gv-filter-label-header">Explorar por Editorial</h6>
                <div className="d-flex justify-content-center flex-wrap gap-2">
                    <button 
                        className={`gv-pill ${!searchParams.get('publisherid') ? 'active' : ''}`}
                        onClick={() => handleFilterChange('publisherid', 'Todos')}
                    >
                        Todas
                    </button>
                    {publishers.map(p => (
                        <button 
                            key={p.id} 
                            className={`gv-pill ${searchParams.get('publisherid') == p.id ? 'active' : ''}`}
                            onClick={() => handleFilterChange('publisherid', p.id)}
                        >
                            {p.name}
                        </button>
                    ))}
                </div>
            </div>

            <h2 className="text-white mb-4 fw-bold">Catálogo Completo</h2>

            {loading ? (
                <div className="text-center py-5">
                    <Spinner animation="border" style={{color: '#a855f7'}} />
                </div>
            ) : (
                <Row xs={1} md={2} lg={3} xl={4} className="g-4">
                    {mangas.length > 0 ? (
                        mangas.map((manga) => (
                            <Col key={manga.id}>
                                <Card className="h-100 bg-dark border-0 rounded-3 gv-manga-card shadow-sm">
                                    <div className="gv-card-img-container position-relative">
                                        <Card.Img 
                                            variant="top" 
                                            src={`${API_URL}/images/mangas/${manga.cover_image}`} 
                                            style={{ height: '400px', objectFit: 'cover' }}
                                            className="gv-manga-img"
                                        />
                                        <Badge bg="warning" text="dark" className="position-absolute top-0 end-0 m-3 fw-bold shadow">
                                            <i className="bi bi-star-fill me-1"></i>{manga.score}
                                        </Badge>
                                    </div>
                                    <Card.Body className="d-flex flex-column p-3">
                                        <Card.Title className="text-white fs-5 fw-bold mb-1 text-truncate">{manga.title}</Card.Title>
                                        <Card.Text 
                                            className="gv-author-link small mb-3"
                                            onClick={() => navigate(`/authors/${manga.author_id}`)}
                                        >
                                            {manga.author_name}
                                        </Card.Text>
                                        
                                        <div className="mt-auto">
                                            <Button 
                                                variant="outline-light" 
                                                className="w-100 gv-btn-outline-purple py-2"
                                                onClick={() => navigate(`/mangas/${manga.id}`)}
                                            >
                                                Ver Detalles
                                            </Button>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))
                    ) : (
                        <Col xs={12}>
                            <div className="text-center text-secondary py-5">
                                <p>No se han encontrado mangas con estos filtros.</p>
                            </div>
                        </Col>
                    )}
                </Row>
            )}
        </Container>
    );
};

export default Mangas;