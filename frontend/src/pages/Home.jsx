import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Container, Row, Col, Card, Button, Badge } from 'react-bootstrap';
import { useSearchParams, useNavigate } from 'react-router-dom';
import '../styles/Home.css';

const Home = () => {
    // Declaramos el navigate para poder cambiar de página
    const navigate = useNavigate();
    
    // Estados para almacenar la información de los juegos y géneros
    const [games, setGames] = useState([]);          
    const [popularGames, setPopularGames] = useState([]); 
    const [genres, setGenres] = useState([]);         
    
    // Estado para controlar la visibilidad del botón "Volver arriba"
    const [showScroll, setShowScroll] = useState(false);

    // Hook para leer los parámetros de la URL 
    const [searchParams, setSearchParams] = useSearchParams();

    const API_URL = "http://localhost:3000";

    // Función para actualizar el género en la URL al pulsar un chip
    const handleGenreChange = (genreId) => {
        const newParams = new URLSearchParams(searchParams);
        if (genreId === 'Todos') {
            newParams.delete('genreid');
        } else {
            newParams.set('genreid', genreId);
        }
        setSearchParams(newParams);
    };

    // Lógica para detectar el scroll y mostrar/ocultar el botón
    useEffect(() => {
        const checkScroll = () => {
            if (!showScroll && window.pageYOffset > 400) setShowScroll(true);
            else if (showScroll && window.pageYOffset <= 400) setShowScroll(false);
        };
        window.addEventListener('scroll', checkScroll);
        return () => window.removeEventListener('scroll', checkScroll);
    }, [showScroll]);

    // Función para hacer scroll hacia arriba suavemente
    const scrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

    // Cargar géneros y populares al montar el componente
    useEffect(() => {
        const fetchGenres = async () => {
            try {
                // Añadimos el parámetro ?type=game para filtrar los géneros de manga
                const res = await axios.get(`${API_URL}/api/genres?type=game`);
                setGenres(res.data);
            } catch (err) {
                console.error("Error al cargar géneros en Home:", err);
            }
        };

        // Petición para obtener los juegos más valorados 
        const fetchPopularGames = async () => {
            try {
                const res = await axios.get(`${API_URL}/api/games/popular`);
                setPopularGames(res.data);
            } catch (err) {
                console.error("Error al obtener populares:", err);
            }
        };

        fetchGenres();
        fetchPopularGames();
    }, []);

    // Efecto principal: Se ejecuta cada vez que la URL cambia 
    useEffect(() => {
        const fetchCatalog = async () => {
            try {
                // Extraemos los filtros de la URL para enviarlos al backend
                const params = {
                    search: searchParams.get('search') || '',
                    genreid: searchParams.get('genreid') || 'Todos',
                    minRating: searchParams.get('minRating') || '',
                    maxRating: searchParams.get('maxRating') || '', 
                    sort: searchParams.get('sort') || ''
                };

                const res = await axios.get(`${API_URL}/api/games`, { params });
                setGames(res.data);
            } catch (err) {
                console.error("Error al obtener catálogo:", err);
            }
        };

        fetchCatalog();
    }, [searchParams]); 

    return (
        <Container fluid className="mt-5 home-container">
            
            <section className="trending-section mb-5">
                <h2 className="mb-4 text-white fw-bold">Juegos Populares</h2>
                <Row className="g-4">
                    {popularGames.slice(0, 6).map(game => (
                        <Col lg={4} md={6} key={game.id}>
                            <Card className="border-0 bg-transparent text-white popular-card" style={{ height: '260px', borderRadius: '16px', overflow: 'hidden' }}>
                                <div style={{ position: 'relative', height: '100%' }}>
                                    <Card.Img 
                                        src={`${API_URL}/images/games/${game.image}`} 
                                        alt={game.title}
                                        style={{ height: '100%', width: '100%', objectFit: 'cover' }}
                                    />
            
                                    <div style={{
                                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                                        background: 'linear-gradient(to top, rgba(10,10,10,0.95) 0%, rgba(10,10,10,0.2) 100%)',
                                        display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
                                        padding: '24px'
                                    }}>
                                        <div className="mb-1" style={{ color: '#FBBF24', fontWeight: 'bold', fontSize: '1.1rem' }}>
                                            ⭐ {game.average_rating}
                                        </div>
                                        <h4 className="fw-bold mb-3 text-truncate">{game.title}</h4>
                                        
                                        <Button 
                                            className="btn-details align-self-start px-4"
                                            onClick={() => navigate(`/game/${game.id}`)}
                                        >
                                            Ver Detalles
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        </Col>
                    ))}
                </Row>
            </section>

            <hr className="my-5" style={{ borderColor: 'rgba(255,255,255,0.05)' }} />

            <section className="catalog-section">
                <h2 className="mb-4 text-white fw-bold">Catálogo Completo</h2>
                
                <div className="filters-container mb-4 d-flex gap-2 flex-wrap">
                    {/* Botón para resetear filtros y mostrar todo */}
                    <button 
                        onClick={() => handleGenreChange('Todos')}
                        className={`rounded-pill filter-chip ${ !searchParams.get('genreid') || searchParams.get('genreid') === 'Todos' ? 'active' : ''}`}
                    >
                        Todos
                    </button>

                    {genres.map(genre => (
                        <button 
                            key={genre.id} 
                            onClick={() => handleGenreChange(genre.id)}
                            className={`rounded-pill filter-chip ${ searchParams.get('genreid') == genre.id ? 'active' : ''}`}
                        >
                            {genre.name}
                        </button>
                    ))}
                </div>

                <Row className="catalog-grid g-4">
                    {games.length > 0 ? (
                        games.map(game => (
                            <Col lg={3} md={4} sm={6} xs={12} key={game.id}>
                                <Card className="h-100 border-0 shadow-sm game-card">
                                    <div style={{ position: 'relative' }}>
                                        <Card.Img 
                                            variant="top" 
                                            src={`${API_URL}/images/games/${game.image}`} 
                                            alt={game.title} 
                                            className="game-image"
                                            style={{ aspectRatio: '3/4', width: '100%', objectFit: 'cover' }}
                                        />
                                        <Badge 
                                            bg="dark" 
                                            style={{ position: 'absolute', top: '12px', right: '12px', fontSize: '0.9rem', borderRadius: '8px' }}
                                        >
                                            ⭐ {game.average_rating}
                                        </Badge>
                                    </div>
                                    <Card.Body className="d-flex flex-column p-3">
                                        <Card.Title className="fs-5 fw-bold text-truncate" title={game.title}>{game.title}</Card.Title>
                                        <Card.Text className="small mb-3 developer-name text-truncate">
                                            {game.developer_name || 'Estudio'}
                                        </Card.Text>

                                        <Button 
                                            className="mt-auto w-100 btn-more"
                                            onClick={() => navigate(`/game/${game.id}`)}
                                        >
                                            Ver más
                                        </Button>
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))
                    ) : (
                        <Col xs={12}>
                            <div className="text-center py-5" style={{ color: '#666' }}>
                                <h4>No se han encontrado juegos con estos filtros.</h4>
                                <p>Prueba a limpiar la búsqueda o ajustar los filtros.</p>
                            </div>
                        </Col>
                    )}
                </Row>
            </section>

            {showScroll && (
                <button className="gv-back-to-top" onClick={scrollTop}>
                    <i className="bi bi-chevron-up"></i>
                </button>
            )}
        </Container>
    );
};

export default Home;