import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Card, Badge, Spinner, Modal, Button } from 'react-bootstrap';
import { useNavigate, useSearchParams } from 'react-router-dom'; // Añadido useSearchParams
import axios from 'axios';

import '../styles/Library.css'; 

const Library = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams(); // Para detectar el token de invitación
    const API_URL = "http://localhost:3000";
    const userId = localStorage.getItem('userId');

    // Estados de la vista (Unificados para Juegos y Mangas)
    const [activeTab, setActiveTab] = useState('games'); // 'games', 'mangas' o 'shared'
    const [items, setItems] = useState([]); // Guarda los juegos o mangas dependiendo de la pestaña
    const [sharedLibraries, setSharedLibraries] = useState([]); // Bibliotecas compartidas por otros
    
    // NUEVO: Estados para los filtros exclusivos de la pestaña Compartidos
    const [sharedFilters, setSharedFilters] = useState({
        search: '',
        sort: 'date_desc' // Por defecto ordenamos por los amigos añadidos más recientemente
    });

    const [genres, setGenres] = useState([]);
    const [stats, setStats] = useState({ total: 0, completed: 0, progress: 0 });
    const [loading, setLoading] = useState(true);
    
    // Filtros activos en la barra de búsqueda
    const [filters, setFilters] = useState({
        search: '',
        status: 'Todos',
        genreid: 'Todos',
        sort: 'date_added'
    });

    // Control del modal de edición
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedEntry, setSelectedEntry] = useState(null);
    const [editData, setEditData] = useState({ status: 'pending', progress: 0, personal_rating: 0 });

    // Estados para compartir biblioteca
    const [showShareModal, setShowShareModal] = useState(false);
    const [shareToken, setShareToken] = useState('');
    const [copied, setCopied] = useState(false);

    // Se ejecuta al cargar la página o cuando el usuario toca algún filtro
    useEffect(() => {
        // Cortamos rápido si es un invitado
        if (!userId) {
            setLoading(false);
            return;
        }

        const loadData = async () => {
            setLoading(true);
            try {
                // Lógica para procesar invitación si existe token en la URL
                const inviteToken = searchParams.get('token');
                if (inviteToken) {
                    await axios.post(`${API_URL}/api/shared/join`, {
                        token: inviteToken,
                        guest_user_id: userId
                    });
                    setSearchParams({}); 
                    setActiveTab('shared');
                }

                if (activeTab === 'shared') {
                    // Carga específica para la pestaña de compartidos
                    const res = await axios.get(`${API_URL}/api/shared/list/${userId}`);
                    setSharedLibraries(res.data);
                } else {
                    // Rutas dinámicas dependiendo de si estamos en Juegos o Mangas
                    const baseLibUrl = activeTab === 'games' ? `${API_URL}/api/library/${userId}` : `${API_URL}/api/library/manga/${userId}`;
                    const baseStatsUrl = activeTab === 'games' ? `${API_URL}/api/library/${userId}/stats` : `${API_URL}/api/library/manga/${userId}/stats`;

                    // Pedimos todo de golpe al servidor para no hacer esperar al usuario
                    const [libRes, statsRes, genRes] = await Promise.all([
                        axios.get(baseLibUrl, { params: filters }),
                        axios.get(baseStatsUrl),
                        axios.get(`${API_URL}/api/genres`)
                    ]);

                    setItems(libRes.data || []);
                    
                    // Unificamos la respuesta de estadísticas para que la vista siempre lea "total", "completed" y "progress"
                    if (activeTab === 'games') {
                        setStats({ 
                            total: statsRes.data.total_games || 0, 
                            completed: statsRes.data.completed_games || 0, 
                            progress: statsRes.data.total_hours || 0 
                        });
                    } else {
                        setStats({ 
                            total: statsRes.data.total_mangas || statsRes.data.total || 0, 
                            completed: statsRes.data.completed_mangas || statsRes.data.completed || 0, 
                            progress: statsRes.data.total_volumes || statsRes.data.volumes_read || 0 
                        });
                    }

                    setGenres(genRes.data || []);
                }
            } catch (err) {
                console.error("Error al traer los datos de la biblioteca:", err);
            } finally {
                // quitamos la rueda de carga
                setLoading(false); 
            }
        };

        loadData();
    }, [userId, filters, activeTab, API_URL, searchParams, setSearchParams]);

    // Lógica para generar el enlace de compartir
    const handleShare = async () => {
        try {
            const res = await axios.post(`${API_URL}/api/shared/share/${userId}`);
            setShareToken(res.data.token);
            setShowShareModal(true);
            setCopied(false);
        } catch (err) {
            console.error("Error al generar el token:", err);
        }
    };

    // Lógica para copiar el enlace al portapapeles
    const copyToClipboard = () => {
        // CAMBIO: Ahora mandamos al usuario directamente a la página de compartido con el token
        const fullUrl = `${window.location.origin}/library?token=${shareToken}`;
        navigator.clipboard.writeText(fullUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Actualiza el estado cuando cambiamos un select de la barra (o escribimos en el buscador)
    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    // NUEVO: Función para actualizar el estado de los filtros de Compartidos
    const handleSharedFilterChange = (e) => {
        setSharedFilters({ ...sharedFilters, [e.target.name]: e.target.value });
    };

    // Cambia de pestaña y resetea los filtros para que no haya conflictos
    const handleTabSwitch = (tab) => {
        setActiveTab(tab);
        setFilters({ search: '', status: 'Todos', genreid: 'Todos', sort: 'date_added' });
        // Opcional: También podemos resetear los de compartidos al cambiar de pestaña
        setSharedFilters({ search: '', sort: 'date_desc' }); 
    };

    // ACCIONES DE LOS BOTONES DE LAS TARJETAS

    // Prepara los datos del juego seleccionado y nos abre la ventana modal
    const handleOpenEdit = (item) => {
        setSelectedEntry(item);
        setEditData({
            status: item.status,
            progress: activeTab === 'games' ? item.hours_played : item.volumes_read,
            personal_rating: item.personal_rating || 0
        });
        setShowEditModal(true);
    };

    // Envía los cambios al backend y recarga la lista para que veamos la actualización al instante
    const handleUpdateEntry = async (e) => {
        e.preventDefault();
        if (!selectedEntry) return;

        const itemId = activeTab === 'games' ? selectedEntry.game_id : selectedEntry.manga_id;
        const endpoint = activeTab === 'games' ? `${API_URL}/api/library/${userId}/${itemId}` : `${API_URL}/api/library/manga/${userId}/${itemId}`;
        
        const payload = {
            status: editData.status,
            personal_rating: editData.personal_rating
        };
        // Dependiendo de la pestaña, mandamos hours_played o volumes_read
        if (activeTab === 'games') payload.hours_played = editData.progress;
        else payload.volumes_read = editData.progress;

        try {
            await axios.put(endpoint, payload);
            setShowEditModal(false);
            
            // Volvemos a pedir juegos y estadísticas actualizadas
            const baseLibUrl = activeTab === 'games' ? `${API_URL}/api/library/${userId}` : `${API_URL}/api/library/manga/${userId}`;
            const baseStatsUrl = activeTab === 'games' ? `${API_URL}/api/library/${userId}/stats` : `${API_URL}/api/library/manga/${userId}/stats`;

            const res = await axios.get(baseLibUrl, { params: filters });
            setItems(res.data);
            const sRes = await axios.get(baseStatsUrl);
            
            if (activeTab === 'games') {
                setStats({ total: sRes.data.total_games || 0, completed: sRes.data.completed_games || 0, progress: sRes.data.total_hours || 0 });
            } else {
                setStats({ total: sRes.data.total_mangas || sRes.data.total || 0, completed: sRes.data.completed_mangas || sRes.data.completed || 0, progress: sRes.data.total_volumes || sRes.data.volumes_read || 0 });
            }
            
        } catch (err) {
            console.error("Fallo al guardar los cambios:", err);
            alert("No se ha podido actualizar la entrada.");
        }
    };

    // Pide confirmación y, si el usuario acepta, borra el juego de su colección
    const handleDeleteEntry = async (itemId) => {
        const textType = activeTab === 'games' ? 'juego' : 'manga';
        if (window.confirm(`¿Seguro que quieres quitar este ${textType} de tu biblioteca?`)) {
            try {
                const endpoint = activeTab === 'games' ? `${API_URL}/api/library/${userId}/${itemId}` : `${API_URL}/api/library/manga/${userId}/${itemId}`;
                await axios.delete(endpoint);
                
                // Lo quitamos de la pantalla filtrando el array actual sin tener que recargar todo
                setItems(items.filter(item => (item.game_id || item.manga_id) !== itemId));
            } catch (err) { 
                console.error("Error al intentar borrar el juego:", err); 
            }
        }
    };


    // NUEVO: Filtramos y ordenamos la lista de amigos en tiempo real (en el Front-end)
    const processedSharedLibraries = sharedLibraries
        .filter(lib => {
            // Comprobamos si el nombre del dueño incluye lo que hemos escrito en el buscador
            return lib.owner_name?.toLowerCase().includes(sharedFilters.search.toLowerCase());
        })
        .sort((a, b) => {
            // Aplicamos la ordenación dependiendo de lo que haya en el select
            if (sharedFilters.sort === 'name_asc') {
                return a.owner_name?.localeCompare(b.owner_name); // Orden alfabético A-Z
            } else if (sharedFilters.sort === 'date_asc') {
                return new Date(a.access_date) - new Date(b.access_date); // Más antiguos primero
            } else {
                // date_desc: Restamos las fechas para que los más recientes salgan primero
                return new Date(b.access_date) - new Date(a.access_date);
            }
        });


    // RENDERIZADO DE LA VISTA

    // Mientras esperamos al servidor, mostramos un spinner
    if (loading) {
        return (
            <div className="gv-library-wrapper d-flex align-items-center justify-content-center" style={{minHeight: '100vh'}}>
                <Spinner animation="border" variant="primary" />
            </div>
        );
    }

    // Vista para invitados (sin Login)
    if (!userId) {
        return (
            <div className="gv-library-wrapper">
                <Container className="pt-4 pb-5" style={{ maxWidth: '1450px' }}>
                
                    <div className="d-flex align-items-center mb-4">
                        <i className="bi bi-collection-play-fill me-3" style={{color: '#c084fc', fontSize: '2rem'}}></i>
                        <h2 className="text-white fw-bold m-0">Mi Colección</h2>
                    </div>

                    <hr className="mt-3 mb-5" style={{ borderColor: '#2a2a32', opacity: 1 }} />

                    <div className="d-flex flex-column align-items-center justify-content-center text-center mt-5 pt-4">
                        <div className="mb-3" style={{ fontSize: '3.2rem', color: '#c084fc' }}>
                            <i className="bi bi-journal-bookmark-fill"></i>
                        </div>
                        <h4 className="text-white fw-bold mb-2 fs-4">Inicia sesión para ver tu biblioteca</h4>
                        <p className="mb-4" style={{ color: '#8b8b99', fontSize: '0.9rem' }}>
                            Guarda tus juegos favoritos y haz un seguimiento de tu progreso.
                        </p>
                        <button 
                            className="btn-details px-4 py-2 fw-bold" 
                            style={{ borderRadius: '25px', backgroundColor: '#c084fc', color: 'black', border: 'none' }} 
                            onClick={() => navigate('/login')}
                        >
                            Ir a Iniciar Sesión
                        </button>
                    </div>

                </Container>
            </div>
        );
    }

    // Pantalla principal para usuarios logueados
    return (
        <div className="gv-library-wrapper">
            <Container className="pt-4 pb-5" style={{ maxWidth: '1450px' }}>
                
                {/* Cabecera */}
                <div className="d-flex align-items-center justify-content-between mb-4">
                    <div className="d-flex align-items-center">
                        <i className="bi bi-collection-play-fill me-3" style={{color: '#c084fc', fontSize: '2rem'}}></i>
                        <h2 className="text-white fw-bold m-0">Mi Colección</h2>
                    </div>
                    
                    <Button 
                        className="gv-btn-share-main d-flex align-items-center gap-2"
                        onClick={handleShare}
                    >
                        <i className="bi bi-share-fill"></i>
                        <span>Compartir Biblioteca</span>
                    </Button>
                </div>

                {/* Pestañas Limpias (Sustituyen a la línea <hr> y al interruptor flotante) */}
                <div className="gv-library-tabs-container">
                    <button 
                        className={`gv-library-tab ${activeTab === 'games' ? 'active' : ''}`}
                        onClick={() => handleTabSwitch('games')}
                    >
                        <i className="bi bi-controller me-2"></i>Juegos
                    </button>
                    <button 
                        className={`gv-library-tab ${activeTab === 'mangas' ? 'active' : ''}`}
                        onClick={() => handleTabSwitch('mangas')}
                    >
                        <i className="bi bi-book-half me-2"></i>Mangas
                    </button>
                    <button 
                        className={`gv-library-tab ${activeTab === 'shared' ? 'active' : ''}`}
                        onClick={() => handleTabSwitch('shared')}
                    >
                        <i className="bi bi-people-fill me-2"></i>Compartidos
                    </button>
                </div>

                {activeTab !== 'shared' ? (
                    <>
                        {/* Cajas de resumen numérico (Stats) */}
                        <Row className="mb-4 g-4">
                            <Col md={4}>
                                <div className="gv-stat-box d-flex align-items-center">
                                    <div className="gv-stat-icon purple">
                                        <i className={activeTab === 'games' ? "bi bi-controller" : "bi bi-book-half"}></i>
                                    </div>
                                    <div className="ms-3">
                                        <small className="gv-stat-label">Total de {activeTab === 'games' ? 'Juegos' : 'Mangas'}</small>
                                        <span className="gv-stat-value">{stats.total || 0}</span>
                                    </div>
                                </div>
                            </Col>
                            <Col md={4}>
                                <div className="gv-stat-box d-flex align-items-center">
                                    <div className="gv-stat-icon green"><i className="bi bi-trophy"></i></div>
                                    <div className="ms-3">
                                        <small className="gv-stat-label">Completados</small>
                                        <span className="gv-stat-value">{stats.completed ?? 0}</span>
                                    </div>
                                </div>
                            </Col>
                            <Col md={4}>
                                <div className="gv-stat-box d-flex align-items-center">
                                    <div className="gv-stat-icon blue">
                                        <i className={activeTab === 'games' ? "bi bi-clock-history" : "bi bi-journal-check"}></i>
                                    </div>
                                    <div className="ms-3">
                                        <small className="gv-stat-label">{activeTab === 'games' ? 'Horas Jugadas' : 'Tomos Leídos'}</small>
                                        <span className="gv-stat-value">{stats.progress || 0}{activeTab === 'games' ? 'h' : ''}</span>
                                    </div>
                                </div>
                            </Col>
                        </Row>

                        {/* Panel de filtrado horizontal */}
                        <div className="gv-filter-bar mb-5">
                            <div className="d-flex align-items-center flex-wrap w-100">
                                
                                <div className="d-flex align-items-center flex-wrap gap-4">
                                    <div className="gv-filter-title">
                                        <i className="bi bi-sliders me-2"></i>
                                        FILTROS
                                    </div>
                                    
                                    {/* --- BUSCADOR LOCAL --- */}
                                    <div className="d-flex align-items-center gap-2">
                                        <Form.Control 
                                            type="text" 
                                            name="search"
                                            placeholder="Buscar en mi colección..." 
                                            className="gv-filter-select text-white" 
                                            style={{ minWidth: '220px', backgroundColor: '#16161a' }}
                                            value={filters.search}
                                            onChange={handleFilterChange}
                                        />
                                    </div>
                                    
                                    <div className="d-flex align-items-center gap-2">
                                        <span className="gv-filter-label">Estado:</span>
                                        <Form.Select name="status" className="gv-filter-select" onChange={handleFilterChange} value={filters.status}>
                                            <option value="Todos">Todos</option>
                                            <option value="playing">{activeTab === 'games' ? 'Jugando' : 'Leyendo'}</option>
                                            <option value="completed">Completado</option>
                                            <option value="pending">Pendiente</option>
                                            <option value="abandoned">Abandonado</option>
                                        </Form.Select>
                                    </div>

                                    <div className="d-flex align-items-center gap-2">
                                        <span className="gv-filter-label">Género:</span>
                                        <Form.Select name="genreid" className="gv-filter-select" onChange={handleFilterChange} value={filters.genreid}>
                                            <option value="Todos">Todos</option>
                                            {genres.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                                        </Form.Select>
                                    </div>
                                </div>

                                {/* Ordenación alineada a la derecha */}
                                <div className="d-flex align-items-center gap-2 ms-auto mt-3 mt-lg-0">
                                    <span className="gv-filter-label">Ordenar por:</span>
                                    <Form.Select name="sort" className="gv-filter-select" onChange={handleFilterChange} value={filters.sort}>
                                        <option value="date_added">Añadidos Recientemente</option>
                                        <option value="title">Título (A-Z)</option>
                                        <option value={activeTab === 'games' ? 'hours' : 'volumes'}>{activeTab === 'games' ? 'Horas Jugadas' : 'Tomos Leídos'}</option>
                                        <option value="rating">Mejor Puntuados</option>
                                    </Form.Select>
                                </div>

                            </div>
                        </div>

                        {/* Listado de tarjetas de juegos */}
                        <Row className="g-4">
                            {items.map(item => {
                                // Configuramos las variables para que sirvan tanto para juegos como mangas
                                const id = activeTab === 'games' ? item.game_id : item.manga_id;
                                const progress = activeTab === 'games' ? item.hours_played : item.volumes_read;
                                const progressLabel = activeTab === 'games' ? 'h' : ' tomos';
                                const progressIcon = activeTab === 'games' ? 'bi-clock' : 'bi-book';
                                const detailUrl = activeTab === 'games' ? `/game/${id}` : `/mangas/${id}`;
                                const imageFolder = activeTab === 'games' ? 'games' : 'mangas';
                                const imageField = activeTab === 'games' ? item.image : item.cover_image;

                                // Mapeo de estados para mostrar en español
                                const statusMap = {
                                    playing: activeTab === 'games' ? 'Jugando' : 'Leyendo',
                                    completed: 'Completado',
                                    abandoned: 'Abandonado',
                                    pending: 'Pendiente'
                                };

                                return (
                                    <Col key={id} xs={12} sm={6} md={4} lg={3}>
                                        <Card className="gv-library-card h-100">
                                            <div className="gv-card-header">
                                                <Badge className={`gv-badge-status ${item.status}`}>
                                                    {statusMap[item.status] || item.status}
                                                </Badge>
                                                <Card.Img src={imageField ? `${API_URL}/images/${imageFolder}/${imageField}` : '/placeholder.jpg'} />
                                                
                                                {/* Capa oscura que aparece al hacer hover con los botones */}
                                                <div className="gv-card-overlay">
                                                    <button className="gv-btn-edit" onClick={() => handleOpenEdit(item)}><i className="bi bi-pencil"></i></button>
                                                    <button className="gv-btn-delete" onClick={() => handleDeleteEntry(id)}><i className="bi bi-trash"></i></button>
                                                </div>
                                            </div>
                                            <Card.Body>
                                                <Card.Title className="gv-card-title text-truncate">{item.title}</Card.Title>
                                                <div className="d-flex justify-content-between small text-muted mt-2">
                                                    <span className="gv-card-hours"><i className={`bi ${progressIcon} me-1`}></i> {progress}{progressLabel}</span>
                                                    <span className="gv-card-rating"><i className="bi bi-star-fill text-warning me-1"></i> {item.personal_rating || '-'}</span>
                                                </div>
                                                <button className="btn-details w-100 mt-3 py-2 rounded-2 fw-bold" onClick={() => navigate(detailUrl)}>
                                                    Ver Detalles
                                                </button>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                );
                            })}
                            
                            {/* Mensaje por si los filtros no devuelven nada */}
                            {items.length === 0 && (
                                <Col xs={12} className="text-center py-5 mt-4">
                                    <h4 className="gv-empty-state-text">
                                        No se encontraron {activeTab === 'games' ? 'juegos' : 'mangas'} que coincidan con estos filtros.
                                    </h4>
                                </Col>
                            )}
                        </Row>
                    </>
                ) : (
                    /* Diseño de bibliotecas compartidas */
                    <>
                        {/* NUEVO: Barra de filtrado reciclada para los usuarios */}
                        <div className="gv-filter-bar mb-5 mt-4">
                            <div className="d-flex align-items-center flex-wrap gap-4 w-100">
                                
                                <div className="gv-filter-title">
                                    <i className="bi bi-sliders me-2"></i>
                                    FILTROS
                                </div>
                                    
                                {/* Buscador de nombres de usuario */}
                                <div className="d-flex align-items-center gap-2">
                                    <Form.Control 
                                        type="text" 
                                        name="search"
                                        placeholder="Buscar usuario..." 
                                        className="gv-filter-select text-white" 
                                        style={{ minWidth: '260px', backgroundColor: '#16161a' }}
                                        value={sharedFilters.search}
                                        onChange={handleSharedFilterChange}
                                    />
                                </div>

                                {/* Select de ordenación pegado al buscador */}
                                <div className="d-flex align-items-center gap-2">
                                    <span className="gv-filter-label">Ordenar por:</span>
                                    <Form.Select name="sort" className="gv-filter-select" onChange={handleSharedFilterChange} value={sharedFilters.sort}>
                                        <option value="date_desc">Más Recientes</option>
                                        <option value="date_asc">Más Antiguos</option>
                                        <option value="name_asc">Alfabético (A-Z)</option>
                                    </Form.Select>
                                </div>

                            </div>
                        </div>

                        {/* Listado de tarjetas mapeando el array que ya hemos filtrado (processedSharedLibraries) */}
                        <Row className="g-4 mt-2">
                            {processedSharedLibraries.map(lib => (
                                <Col key={lib.library_id} xs={12} sm={6} md={4} lg={3}>
                                    <Card className="gv-shared-card h-100 shadow-lg">
                                        <div className="gv-shared-banner">
                                            <div className="gv-shared-avatar-wrapper">
                                                <img 
                                                    src={lib.owner_avatar ? `${API_URL}/images/avatars/${lib.owner_avatar}` : 'https://via.placeholder.com/80'} 
                                                    className="gv-shared-avatar" 
                                                    alt="avatar" 
                                                />
                                            </div>
                                        </div>
                                        <Card.Body className="text-center pt-5">
                                            <h5 className="text-white fw-bold mb-1">Biblioteca de {lib.owner_name}</h5>
                                            <p className="text-muted small mb-3">Miembro desde {new Date(lib.access_date).toLocaleDateString()}</p>
                                            <Button 
                                                className="gv-btn-view-vault w-100 rounded-pill mt-3" 
                                                onClick={() => navigate(`/shared/${lib.library_id}`)}
                                            >
                                                Explorar Biblioteca
                                            </Button>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            ))}

                            {/* Mensaje por si buscas un amigo que no existe */}
                            {processedSharedLibraries.length === 0 && (
                                <Col xs={12} className="text-center py-5 mt-4">
                                    <h4 className="gv-empty-state-text">
                                        No sigues a ningún usuario con ese nombre.
                                    </h4>
                                </Col>
                            )}
                        </Row>
                    </>
                )}
            </Container>

            {/* Modal para editar horas, estado y nota */}
            <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered contentClassName="gv-modal-dark">
                <Modal.Header closeButton closeVariant="white"><Modal.Title>Editar Progreso</Modal.Title></Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleUpdateEntry}>
                        <Form.Group className="mb-3">
                            <Form.Label>Estado</Form.Label>
                            <Form.Select 
                                value={editData.status} 
                                className="gv-input-dark" 
                                onChange={e => {
                                    const newStatus = e.target.value;
                                    setEditData({
                                        ...editData, 
                                        status: newStatus,
                                        // Reset al cambiar a pendiente
                                        progress: newStatus === 'pending' ? 0 : editData.progress,
                                        personal_rating: newStatus === 'pending' ? 0 : editData.personal_rating
                                    });
                                }}
                            >
                                <option value="pending">Pendiente</option>
                                <option value="playing">{activeTab === 'games' ? 'Jugando' : 'Leyendo'}</option>
                                <option value="completed">Completado</option>
                                <option value="abandoned">Abandonado</option>
                            </Form.Select>
                        </Form.Group>
                        <Row>
                            <Col>
                                <Form.Group className="mb-3">
                                    <Form.Label>{activeTab === 'games' ? 'Horas' : 'Tomos'}</Form.Label>
                                    <Form.Control 
                                        type="number" 
                                        className="gv-input-dark" 
                                        value={editData.status === 'pending' ? 0 : editData.progress} 
                                        onChange={e => {
                                            // TERCER CANDADO: Si es pendiente, ignoramos lo que escriba
                                            if (editData.status !== 'pending') {
                                                setEditData({...editData, progress: e.target.value});
                                            }
                                        }} 
                                        disabled={editData.status === 'pending'} // PRIMER CANDADO (Bloqueo visual y de click)
                                        readOnly={editData.status === 'pending'} // SEGUNDO CANDADO (Bloqueo de teclado)
                                    />
                                </Form.Group>
                            </Col>
                            <Col>
                                <Form.Group className="mb-3">
                                    <Form.Label>Nota (0-10)</Form.Label>
                                    <Form.Control 
                                        type="number" 
                                        step="1" 
                                        max="10" 
                                        min="0" 
                                        className="gv-input-dark" 
                                        value={editData.status === 'pending' ? 0 : editData.personal_rating} 
                                        onChange={e => {
                                            // TERCER CANDADO: Si es pendiente, ignoramos lo que escriba
                                            if (editData.status !== 'pending') {
                                                setEditData({...editData, personal_rating: e.target.value});
                                            }
                                        }} 
                                        disabled={editData.status === 'pending'} // PRIMER CANDADO (Bloqueo visual y de click)
                                        readOnly={editData.status === 'pending'} // SEGUNDO CANDADO (Bloqueo de teclado)
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        <button type="submit" className="gv-btn-purple w-100 mt-3 py-2">Guardar Cambios</button>
                    </Form>
                </Modal.Body>
            </Modal>

            {/* Modal para mostrar el enlace generado */}
            <Modal show={showShareModal} onHide={() => setShowShareModal(false)} centered contentClassName="gv-modal-dark">
                <Modal.Header closeButton closeVariant="white">
                    <Modal.Title>Compartir Biblioteca</Modal.Title>
                </Modal.Header>
                <Modal.Body className="py-4">
                    <p className="text-muted small">Cualquiera con este enlace podrá ver tu colección de juegos y mangas.</p>
                    <div className="d-flex gap-2">
                        <Form.Control 
                            readOnly 
                            value={`${window.location.origin}/library?token=${shareToken}`}
                            className="gv-input-dark"
                        />
                        <Button className="gv-btn-purple" onClick={copyToClipboard}>
                            {copied ? <i className="bi bi-check-lg"></i> : <i className="bi bi-clipboard"></i>}
                        </Button>
                    </div>
                    {copied && <div className="text-success mt-2 small text-center">¡Enlace copiado al portapapeles!</div>}
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default Library;