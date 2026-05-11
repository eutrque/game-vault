import React, { useState, useEffect } from 'react'; 
import axios from 'axios';
import { useNavigate, useSearchParams, Link, useLocation } from 'react-router-dom';
import { Navbar as BootstrapNavbar, Nav, Container, Form, Button } from 'react-bootstrap';
import '../styles/Navbar.css';

const Navbar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const API_URL = "http://localhost:3000";
    
    // Lógica para detectar sección y no perder el foco de búsqueda
    const isMangaSection = location.pathname.startsWith('/mangas');
    const basePath = isMangaSection ? '/mangas' : '/';

    // Filtros locales y UI
    const [tempSearch, setTempSearch] = useState(searchParams.get('search') || '');
    const [minRating, setMinRating] = useState(searchParams.get('minRating') || '0');
    const [sort, setSort] = useState(searchParams.get('sort') || 'relevance');
    const [showFilters, setShowFilters] = useState(false);
    const [genres, setGenres] = useState([]);

    // Estado de sesión reactivo
    const [session, setSession] = useState({
        isLoggedIn: false,
        userName: 'Invitado',
        userAvatar: 'https://via.placeholder.com/35',
        role: 'user' // Para controlar el botón de Admin
    });

    // Cargar géneros dinámicamente dependiendo de la sección actual
    useEffect(() => {
        const fetchGenres = async () => {
            try {
                // 1. Miramos en qué sección estamos
                const type = isMangaSection ? 'manga' : 'game';
                
                // 2. Le pasamos el 'type' a la API para que los filtre
                const res = await axios.get(`${API_URL}/api/genres?type=${type}`);
                setGenres(res.data);
            } catch (err) {
                console.error("Fallo al cargar géneros:", err);
            }
        };
        fetchGenres();
    }, [isMangaSection]); // Esto hace que si pasas de juegos a mangas, vuelva a buscar


    // Sincronización de sesión basada en la ubicación
    useEffect(() => {
        const userId = localStorage.getItem('userId');
        const nickname = localStorage.getItem('nickname');
        const avatarFile = localStorage.getItem('avatar_img');
        const role = localStorage.getItem('role');

        if (userId) {
            setSession({
                isLoggedIn: true,
                userName: nickname || 'Usuario',
                userAvatar: avatarFile ? `${API_URL}/images/avatars/${avatarFile}` : 'https://via.placeholder.com/35',
                role: role || 'user'
            });
        } else {
            setSession({ isLoggedIn: false, userName: 'Invitado', userAvatar: 'https://via.placeholder.com/35', role: 'user' });
        }
    }, [location.pathname]); 

    // Sincronizar estados locales cuando la URL cambia externamente
    useEffect(() => {
        const urlS = searchParams.get('search') || '';
        const urlM = searchParams.get('minRating') || '0';
        const urlSt = searchParams.get('sort') || 'relevance';

        if (urlS !== tempSearch) setTempSearch(urlS);
        if (urlM !== minRating) setMinRating(urlM);
        if (urlSt !== sort) setSort(urlSt);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]); 

    // Debounce del buscador
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            const currentSearchInUrl = searchParams.get('search') || '';
            
            if (tempSearch !== currentSearchInUrl) {
                const params = new URLSearchParams(searchParams);
                if (tempSearch.trim()) {
                    params.set('search', tempSearch.trim());
                } else {
                    params.delete('search');
                }
                // Ajustado para navegar a la sección correspondiente ( / o /mangas )
                navigate(`${basePath}?${params.toString()}`, { replace: true });
            }
        }, 400); 

        return () => clearTimeout(delayDebounceFn);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tempSearch, basePath]);

    // Botón aplicar del panel avanzado
    const handleApplyFilters = (e) => {
        if (e) e.preventDefault();
        const params = new URLSearchParams(searchParams);
        params.set('minRating', minRating);
        params.set('sort', sort);
        navigate(`${basePath}?${params.toString()}`);
        setShowFilters(false);
    };

    // Resetear filtros
    const handleClearFilters = () => {
        setTempSearch('');
        setMinRating('0');
        setSort('relevance');
        navigate(basePath);
        setShowFilters(false);
    };

    // Evitar renderizar el navbar en las pantallas de auth
    const rutasSinNavbar = ['/login', '/register', '/forgot-password', '/reset-password'];
    if (rutasSinNavbar.includes(location.pathname)) {
        return null;
    }

    // Ocultamos el buscador en admin y perfil
    const hideSearch = location.pathname === '/admin' || location.pathname === '/profile';

    return (
        <BootstrapNavbar expand="lg" variant="dark" className="py-3 sticky-top gv-navbar">
            <Container fluid className="px-4"> 
                <BootstrapNavbar.Brand as={Link} to="/" className="fw-bold fs-3 m-0 gv-logo">
                    Game<span>Vault</span>
                </BootstrapNavbar.Brand>

                <BootstrapNavbar.Toggle aria-controls="basic-navbar-nav" />

                <BootstrapNavbar.Collapse id="basic-navbar-nav">
                    {!hideSearch && <div className="d-none d-lg-block" style={{ flex: 0.8 }}></div>}
                    
                    {!hideSearch && (
                        <div className="mx-auto position-relative" style={{ width: '100%', maxWidth: '450px' }}>
                            <div className="gv-search-wrapper">
                                <i className="bi bi-search gv-search-icon"></i>
                                <Form.Control
                                    type="text"
                                    placeholder={isMangaSection ? "Buscar mangas..." : "Buscar juegos..."}
                                    className="gv-search-input"
                                    value={tempSearch}
                                    onChange={(e) => setTempSearch(e.target.value)}
                                />
                                <button 
                                    type="button" 
                                    className={`gv-filter-inline-btn ${showFilters ? 'active' : ''}`}
                                    onClick={() => setShowFilters(!showFilters)}
                                >
                                    <i className="bi bi-sliders"></i>
                                </button>
                            </div>

                            {/* Panel de filtros avanzado */}
                            {showFilters && (
                                <div className="gv-custom-filter-panel shadow-lg">
                                    <h5 className="gv-panel-title">Filtros Avanzados</h5>
                                    
                                    <div className="gv-filter-section">
                                        <label className="gv-label">Género</label>
                                        <select 
                                            className="gv-custom-select" 
                                            value={searchParams.get('genreid') || 'Todos'}
                                            onChange={(e) => {
                                                const p = new URLSearchParams(searchParams);
                                                if (e.target.value === 'Todos') p.delete('genreid');
                                                else p.set('genreid', e.target.value);
                                                navigate(`${basePath}?${p.toString()}`);
                                            }}
                                        >
                                            <option value="Todos">Todos los géneros</option>
                                            {genres.map(g => (
                                                <option key={g.id} value={g.id}>{g.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="gv-filter-section">
                                        <label className="gv-label">Valoración mínima</label>
                                        <select 
                                            className="gv-custom-select" 
                                            value={minRating}
                                            onChange={(e) => setMinRating(e.target.value)}
                                        >
                                            <option value="0">Todas las valoraciones</option>
                                            <option value="9">Aclamado (9+)</option>
                                            <option value="8">Muy positivo (8+)</option>
                                            <option value="7">Positivo (7+)</option>
                                            <option value="5">Mixto (5+)</option>
                                        </select>
                                    </div>

                                    <div className="gv-filter-section">
                                        <label className="gv-label">Ordenar por</label>
                                        <div className="gv-sort-group">
                                            <button type="button" className={`gv-sort-btn ${sort === 'relevance' ? 'active' : ''}`} onClick={() => setSort('relevance')}>Relevancia</button>
                                            <button type="button" className={`gv-sort-btn ${sort === 'date' ? 'active' : ''}`} onClick={() => setSort('date')}>Fecha</button>
                                            {/* Adaptamos el botón de nota al campo 'score' si estamos en mangas */}
                                            <button type="button" className={`gv-sort-btn ${sort === (isMangaSection ? 'score' : 'rating') ? 'active' : ''}`} onClick={() => setSort(isMangaSection ? 'score' : 'rating')}>Nota</button>
                                        </div>
                                    </div>

                                    <div className="gv-action-row">
                                        <button type="button" className="gv-btn-clear" onClick={handleClearFilters}>Limpiar</button>
                                        <button type="submit" className="gv-btn-apply" onClick={handleApplyFilters}>Aplicar</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <Nav className={`align-items-center gap-2 ${hideSearch ? 'ms-auto' : 'justify-content-lg-end'}`} style={{ flex: hideSearch ? 'none' : 1 }}>

                        <Nav.Link as={Link} to="/" className={`px-2 ${location.pathname === '/' ? 'gv-nav-active' : 'text-white'}`}>Inicio</Nav.Link>
                        
                        {/* pestaña de Mangas */}
                        <Nav.Link as={Link} to="/mangas" className={`px-2 ${location.pathname === '/mangas' ? 'gv-nav-active' : 'text-white'}`}>Mangas</Nav.Link>
                        
                        <Nav.Link as={Link} to="/library" className={`px-2 ${location.pathname === '/library' ? 'gv-nav-active' : 'text-white'}`}>Biblioteca</Nav.Link>
                        
                        {/* Botón Admin Panel: solo para administradores */}
                        {session.isLoggedIn && session.role === 'admin' && location.pathname !== '/admin' && (
                            <Nav.Link as={Link} to="/admin" className="text-warning fw-bold px-2">
                                <i className="bi bi-shield-lock me-1"></i> Admin Panel
                            </Nav.Link>
                        )}
                        
                        {session.isLoggedIn ? (
                            <div className="gv-profile-pill ms-2" onClick={() => navigate('/profile')} style={{cursor: 'pointer'}}>
                                <span className="text-white fw-bold d-none d-xl-inline me-2">{session.userName}</span>
                                <img src={session.userAvatar} alt="avatar" className="gv-avatar-img" style={{width: '35px', height: '35px', borderRadius: '50%', objectFit: 'cover'}} />
                            </div>
                        ) : (
                            <Button onClick={() => navigate('/login')} className="btn-details px-4 rounded-pill fw-bold ms-2">Iniciar Sesión</Button>
                        )}
                    </Nav>
                </BootstrapNavbar.Collapse>
            </Container>
        </BootstrapNavbar>
    );
};

export default Navbar;