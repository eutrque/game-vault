import React, { useState, useEffect } from 'react';
import { Container, Table, Spinner, Alert, Pagination, Modal, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

import '../styles/AdminPanel.css'; 

const AdminPanel = () => {
    const navigate = useNavigate();
    const API_URL = "http://localhost:3000";

    // Estados principales de la vista
    const [activeTab, setActiveTab] = useState('games'); 
    const [games, setGames] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Estado para el buscador
    const [searchTerm, setSearchTerm] = useState('');

    // Estados del modal y listas de la BD
    const [showForm, setShowForm] = useState(false); 
    const [editingGame, setEditingGame] = useState(null); 
    const [developers, setDevelopers] = useState([]); 
    const [genresList, setGenresList] = useState([]);       
    const [platformsList, setPlatformsList] = useState([]); 
    
    // Objeto que guarda lo que vamos escribiendo en el formulario (Data binding)
    const [formData, setFormData] = useState({
        title: '',
        release_date: '',
        developer_id: '',
        average_rating: '', 
        description: '',
        genres: [],
        platforms: [],
        image: null // null porque aquí guardamos el archivo físico, no texto
    });

    // Variables de paginación
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8; 

    // Resetear a la página 1 y limpiar el buscador si cambiamos de pestaña 
    useEffect(() => {
        setCurrentPage(1);
        setSearchTerm('');
    }, [activeTab]);

    // Efecto principal: Comprueba la seguridad (si somos admin) y descarga toda la info al entrar
    useEffect(() => {
        const checkAdminAndFetchData = async () => {
            const userId = localStorage.getItem('userId');
            
            // Si entra alguien sin loguearse, lo mandamos fuera
            if (!userId) {
                navigate('/login');
                return;
            }

            try {
                // Comprobamos si el user es admin de verdad en la BD. Si no, de vuelta al perfil.
                const userRes = await axios.get(`${API_URL}/api/users/${userId}`);
                if (userRes.data.role !== 'admin') {
                    navigate('/profile');
                    return;
                }

                // Promise.all: hacemos todos los GET a la vez para que cargue más rápido y no haya tirones
                const [gamesRes, usersRes, devsRes, genresRes, platformsRes] = await Promise.all([
                    axios.get(`${API_URL}/api/games`).catch(() => ({ data: [] })),
                    axios.get(`${API_URL}/api/users`).catch(() => ({ data: [] })),
                    axios.get(`${API_URL}/api/developers`).catch(() => ({ data: [] })),
                    axios.get(`${API_URL}/api/genres`).catch(() => ({ data: [] })),
                    axios.get(`${API_URL}/api/platforms`).catch(() => ({ data: [] }))
                ]);

                // Guardamos todo lo que nos trae el servidor en sus estados correspondientes
                setGames(gamesRes.data);
                setUsers(usersRes.data);
                setDevelopers(devsRes.data);
                setGenresList(genresRes.data);
                setPlatformsList(platformsRes.data);

            } catch (err) {
                console.error("Error cargando datos:", err);
                setError("Fallo al comprobar permisos de admin.");
            } finally {
                // Quitamos la rueda de carga cuando termina todo (falle o no)
                setLoading(false);
            }
        };

        checkAdminAndFetchData();
    }, [navigate]);


    // Filtramos los datos ANTES de paginarlos según lo que haya escrito el usuario en el buscador
    const filteredData = (activeTab === 'games' ? games : users).filter(item => {
        if (!searchTerm) return true;
        const lowerSearch = searchTerm.toLowerCase();
        
        // Si estamos en la pestaña juegos, buscamos por título o desarrollador
        if (activeTab === 'games') {
            return item.title?.toLowerCase().includes(lowerSearch) || 
                   item.developer_name?.toLowerCase().includes(lowerSearch);
        } else {
            // Si estamos en la pestaña usuarios, buscamos por apodo, nombre de usuario o correo
            return item.nickname?.toLowerCase().includes(lowerSearch) || 
                   item.username?.toLowerCase().includes(lowerSearch) || 
                   item.email?.toLowerCase().includes(lowerSearch);
        }
    });

    // Cálculos para la paginación (cortamos el array filtrado para mostrar de 8 en 8)
    const lastIndex = currentPage * itemsPerPage;
    const firstIndex = lastIndex - itemsPerPage;
    const recordsToShow = filteredData.slice(firstIndex, lastIndex);
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);


    // --- FUNCIONES DEL FORMULARIO ---

    // Pilla lo que escribimos en los inputs de texto normales
    const handleFormChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    // Pilla el archivo físico que subimos para luego pasarlo a Multer
    const handleFileChange = (e) => {
        setFormData({
            ...formData,
            image: e.target.files[0] 
        });
    };

    // Pilla los clics en las casillas (Checkboxes) de Géneros y Plataformas
    const handleCheckboxChange = (e, fieldName) => {
        const { value, checked } = e.target;
        
        setFormData(prev => {
            const currentArray = prev[fieldName];
            if (checked) {
                return { ...prev, [fieldName]: [...currentArray, value] };
            } else {
                return { ...prev, [fieldName]: currentArray.filter(item => item !== value) };
            }
        });
    };

    // Abre el modal limpio para crear un juego de cero
    const handleOpenAdd = () => {
        setEditingGame(null);
        setFormData({ title: '', release_date: '', developer_id: '', average_rating: '', description: '', genres: [], platforms: [], image: null });
        setShowForm(true);
    };

    // Abre el modal y rellena los datos del juego que queremos editar
    const handleOpenEdit = async (game) => {
        setEditingGame(game);
        
        try {
            const res = await axios.get(`${API_URL}/api/games/${game.id}`);
            const fullGame = res.data;

            const gameGenresNames = fullGame.genres || [];
            const gamePlatformsNames = fullGame.platforms || [];

            // Normalizador para evitar fallos por tildes o mayúsculas al comparar con la BD
            const normalize = (str) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

            const normalizedGameGenres = gameGenresNames.map(normalize);
            const normalizedGamePlatforms = gamePlatformsNames.map(normalize);

            const selectedGenres = genresList
                .filter(g => normalizedGameGenres.includes(normalize(g.name)))
                .map(g => g.id.toString());

            const selectedPlatforms = platformsList
                .filter(p => normalizedGamePlatforms.includes(normalize(p.name)))
                .map(p => p.id.toString());

            setFormData({
                title: fullGame.title || '',
                release_date: fullGame.release_date ? new Date(fullGame.release_date).toISOString().split('T')[0] : '',
                developer_id: fullGame.developer_id ? fullGame.developer_id.toString() : '',
                average_rating: fullGame.average_rating || '',
                description: fullGame.description || '',
                genres: selectedGenres,
                platforms: selectedPlatforms,
                image: null 
            });
            setShowForm(true);
        } catch (error) {
            console.error("Error pillando detalles del juego", error);
        }
    };

    // Cierra la ventana flotante (modal) y limpia el estado del juego que estábamos editando
    const handleCloseForm = () => {
        setShowForm(false);
        setEditingGame(null);
    };

    // Función principal para enviar datos al backend (POST o PUT)
    const handleSubmitGame = async (e) => {
        e.preventDefault(); 
        
        // Bloqueo de seguridad si faltan géneros o plataformas
        if (formData.genres.length === 0) {
            alert("¡Error! Debes seleccionar al menos un género.");
            return;
        }
        if (formData.platforms.length === 0) {
            alert("¡Error! Debes seleccionar al menos una plataforma.");
            return;
        }

        // Usamos FormData en lugar de un JSON normal porque vamos a enviar un archivo (la imagen)
        const submitData = new FormData();
        submitData.append('title', formData.title);
        submitData.append('release_date', formData.release_date);
        submitData.append('developer_id', formData.developer_id);
        submitData.append('average_rating', formData.average_rating);
        submitData.append('description', formData.description);
        
        // Pasamos los arrays a texto plano (JSON string) para que el backend pueda leerlos
        submitData.append('genres', JSON.stringify(formData.genres));
        submitData.append('platforms', JSON.stringify(formData.platforms));
        
        // Si el admin subió una imagen nueva, la adjuntamos
        if (formData.image) {
            submitData.append('image', formData.image);
        }

        try {
            // Si estábamos editando, hacemos un PUT. Si es un juego nuevo, hacemos un POST.
            if (editingGame) {
                await axios.put(`${API_URL}/api/games/${editingGame.id}`, submitData);
            } else {
                await axios.post(`${API_URL}/api/games`, submitData);
            }
            
            // Recargamos la lista de juegos para que aparezca el cambio al instante
            const gamesRes = await axios.get(`${API_URL}/api/games`);
            setGames(gamesRes.data);
            handleCloseForm();
        } catch (err) {
            console.error("Error al guardar:", err);
            alert("No se ha podido guardar el juego en la BD.");
        }
    };

    // Pide confirmación de seguridad y borra definitivamente un juego de la BD
    const handleDeleteGame = async (id) => {
        if (window.confirm("¿Seguro que quieres borrar este juego de la BD?")) {
            try {
                await axios.delete(`${API_URL}/api/games/${id}`);
                // Lo borramos de la vista actual sin tener que recargar toda la página
                setGames(games.filter(game => game.id !== id));
            } catch (err) {
                console.error("Error al borrar:", err);
            }
        }
    };

    // --- LÓGICA DE SUSPENSIÓN DE CUENTAS (USUARIOS) ---
    const handleToggleBan = async (userId, currentState) => {
        const newState = currentState ? 0 : 1; 
        const actionText = currentState ? "banear" : "desbanear";

        if (window.confirm(`¿Seguro que quieres ${actionText} a este usuario?`)) {
            try {
                // Llamada al servidor para actualizar su estado 
                await axios.put(`${API_URL}/api/users/${userId}/status`, { state: newState });
                
                // Truco para que cambie en pantalla al momento
                setUsers(users.map(user => 
                    user.id === userId ? { ...user, state: newState } : user
                ));
            } catch (err) {
                console.error(`Error al ${actionText} usuario:`, err);
                alert("Fallo al conectar con el servidor.");
            }
        }
    };

    // Mientras carga la información inicial, mostramos la rueda girando
    if (loading) return <div className="text-center pt-5 text-white"><Spinner animation="border" variant="primary" /></div>;

    // RENDERIZADO DE LA VISTA
    return (
        <div className="gv-admin-wrapper">
            <Container className="pt-4 pb-5">
                {/* Mensaje de error si falla la comprobación de admin */}
                {error && <Alert variant="danger" dismissible>{error}</Alert>}

                <div className="d-flex justify-content-center align-items-center mb-5 mt-3">
                    <h2 className="text-white fw-bold m-0">Panel de Control Admin</h2>
                </div>

                {/* Botones para cambiar entre la pestaña de Juegos y Usuarios */}
                <div className="gv-admin-tabs mb-4">
                    <button className={`gv-tab-btn ${activeTab === 'games' ? 'active' : ''}`} onClick={() => setActiveTab('games')}>
                        Gestión de juegos
                    </button>
                    <button className={`gv-tab-btn ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
                        Gestión de usuarios
                    </button>
                </div>

                <div className="gv-admin-content-box">
                    
                    {/* --- TABLA DE JUEGOS --- */}
                    {activeTab === 'games' && (
                        <>
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                {/* Buscador local de juegos */}
                                <Form.Control 
                                    type="text" 
                                    placeholder="Buscar juego o estudio..." 
                                    className="gv-admin-search"
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setCurrentPage(1); // Volvemos a la pag 1 al buscar para no quedarnos en una página vacía
                                    }}
                                />
                                <button className="gv-btn-purple" onClick={handleOpenAdd}>+ Añadir Videojuego</button>
                            </div>
                            <div className="gv-table-responsive">
                                <Table hover className="gv-admin-table align-middle">
                                    <thead>
                                        <tr>
                                            <th>ID</th><th>TÍTULO</th><th>DESARROLLADOR</th><th>AÑO</th><th>RATING</th><th className="text-end">ACCIONES</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {/* Comprobamos si hay juegos para mostrar después del filtro */}
                                        {recordsToShow.length > 0 ? (
                                            recordsToShow.map((game) => (
                                                <tr key={game.id}>
                                                    <td className="text-muted">#{game.id}</td>
                                                    <td className="fw-bold text-white">{game.title}</td>
                                                    <td className="text-muted">{game.developer_name || `ID: ${game.developer_id}`}</td>
                                                    <td className="text-muted">{game.release_date ? new Date(game.release_date).getFullYear() : '---'}</td>
                                                    <td>
                                                        <span className="text-warning"><i className="bi bi-star-fill"></i></span> 
                                                        <span className="text-white ms-1">{game.average_rating || '0.0'}</span>
                                                    </td>
                                                    <td className="text-end">
                                                        <button className="gv-btn-action text-white" onClick={() => handleOpenEdit(game)}>Editar</button>
                                                        <span className="text-muted mx-2">/</span>
                                                        <button className="gv-btn-action text-danger" onClick={() => handleDeleteGame(game.id)}>Borrar</button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            /* Si no hay resultados de búsqueda, mostramos un mensaje */
                                            <tr><td colSpan="6" className="text-center text-muted py-4">No se encontraron resultados</td></tr>
                                        )}
                                    </tbody>
                                </Table>
                            </div>
                        </>
                    )}

                    {/* --- TABLA DE USUARIOS --- */}
                    {activeTab === 'users' && (
                        <>
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                {/* Buscador local de usuarios */}
                                <Form.Control 
                                    type="text" 
                                    placeholder="Buscar por apodo o correo..." 
                                    className="gv-admin-search"
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setCurrentPage(1); 
                                    }}
                                />
                            </div>
                            <div className="gv-table-responsive">
                                <Table hover className="gv-admin-table align-middle">
                                    <thead>
                                        <tr>
                                            <th>USUARIO</th><th>CORREO</th><th>ROL</th><th>ESTADO</th><th className="text-end">ACCIONES</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {/* Comprobamos si hay usuarios para mostrar después del filtro */}
                                        {recordsToShow.length > 0 ? (
                                            recordsToShow.map((user) => (
                                                <tr key={user.id}>
                                                    <td className="fw-bold text-white">
                                                        {user.nickname}
                                                        <small className="text-muted d-block">@{user.username}</small>
                                                    </td>
                                                    <td className="text-muted">{user.email}</td>
                                                    <td className="text-muted">{user.role === 'admin' ? 'Admin' : 'Usuario'}</td>
                                                    <td>
                                                        {user.state ? (
                                                            <span className="text-success"><i className="bi bi-check-circle-fill"></i> Activo</span>
                                                        ) : (
                                                            <span className="text-danger"><i className="bi bi-slash-circle-fill"></i> Suspendido</span>
                                                        )}
                                                    </td>
                                                    <td className="text-end">
                                                        {user.state ? (
                                                            <button className="gv-btn-action text-danger" onClick={() => handleToggleBan(user.id, user.state)}>Suspender</button>
                                                        ) : (
                                                            <button className="gv-btn-action text-success" onClick={() => handleToggleBan(user.id, user.state)}>Activar</button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr><td colSpan="5" className="text-center text-muted py-4">No se encontraron resultados</td></tr>
                                        )}
                                    </tbody>
                                </Table>
                            </div>
                        </>
                    )}

                    {/* --- CONTROLES DE PAGINACIÓN --- */}
                    {totalPages > 1 && (
                        <div className="d-flex justify-content-center mt-4 gv-pagination-container">
                            <Pagination>
                                <Pagination.First disabled={currentPage === 1} onClick={() => setCurrentPage(1)} />
                                <Pagination.Prev disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} />
                                {[...Array(totalPages)].map((_, i) => (
                                    <Pagination.Item key={i + 1} active={i + 1 === currentPage} onClick={() => setCurrentPage(i + 1)}>{i + 1}</Pagination.Item>
                                ))}
                                <Pagination.Next disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)} />
                                <Pagination.Last disabled={currentPage === totalPages} onClick={() => setCurrentPage(totalPages)} />
                            </Pagination>
                        </div>
                    )}
                </div>
            </Container>

            {/* MODAL PARA AÑADIR/EDITAR JUEGOS */}
            <Modal show={showForm} onHide={handleCloseForm} centered size="lg" contentClassName="gv-admin-modal">
                <Modal.Header closeButton closeVariant="white">
                    <Modal.Title className="text-white fw-bold">{editingGame ? 'Editar Videojuego' : 'Añadir Nuevo Videojuego'}</Modal.Title>
                </Modal.Header>
                <Modal.Body className="text-white">
                    <Form onSubmit={handleSubmitGame}>
                        <div className="row">
                            <div className="col-md-6">
                                <Form.Group className="mb-3">
                                    <Form.Label className="text-muted">Título del juego *</Form.Label>
                                    <Form.Control type="text" name="title" className="gv-form-input" placeholder="Ej: Borderlands 2..." value={formData.title} onChange={handleFormChange} required />
                                </Form.Group>
                            </div>
                            <div className="col-md-3">
                                <Form.Group className="mb-3">
                                    <Form.Label className="text-muted">Lanzamiento *</Form.Label>
                                    <Form.Control type="date" name="release_date" className="gv-form-input" value={formData.release_date} onChange={handleFormChange} required />
                                </Form.Group>
                            </div>
                            <div className="col-md-3">
                                <Form.Group className="mb-3">
                                    <Form.Label className="text-muted">Nota (0-10) *</Form.Label>
                                    <Form.Control type="number" step="0.1" min="0" max="10" name="average_rating" className="gv-form-input" placeholder="Ej: 8.9" value={formData.average_rating} onChange={handleFormChange} required />
                                </Form.Group>
                            </div>
                        </div>

                        <Form.Group className="mb-3">
                            <Form.Label className="text-muted">Desarrollador *</Form.Label>
                            <Form.Select name="developer_id" className="gv-form-input" value={formData.developer_id} onChange={handleFormChange} required>
                                <option value="">Selecciona un estudio...</option>
                                {developers.map(dev => <option key={dev.id} value={dev.id}>{dev.name}</option>)}
                            </Form.Select>
                        </Form.Group>

                        <div className="row mb-3">
                            <div className="col-md-6">
                                <Form.Label className="text-muted">Géneros *</Form.Label>
                                <div className="p-2 gv-checkbox-container" style={{ maxHeight: '150px', overflowY: 'auto' }}>
                                    {genresList.map(genre => (
                                        <Form.Check key={genre.id} type="checkbox" id={`genre-${genre.id}`} label={genre.name} value={genre.id.toString()} checked={formData.genres.includes(genre.id.toString())} onChange={(e) => handleCheckboxChange(e, 'genres')} />
                                    ))}
                                </div>
                            </div>
                            <div className="col-md-6">
                                <Form.Label className="text-muted">Plataformas *</Form.Label>
                                <div className="p-2 gv-checkbox-container" style={{ maxHeight: '150px', overflowY: 'auto' }}>
                                    {platformsList.map(platform => (
                                        <Form.Check key={platform.id} type="checkbox" id={`plat-${platform.id}`} label={platform.name} value={platform.id.toString()} checked={formData.platforms.includes(platform.id.toString())} onChange={(e) => handleCheckboxChange(e, 'platforms')} />
                                    ))}
                                </div>
                            </div>
                        </div>

                        <Form.Group className="mb-3">
                            <Form.Label className="text-muted">Descripción</Form.Label>
                            <Form.Control as="textarea" rows={3} name="description" className="gv-form-input" placeholder="Escribe una sinopsis..." value={formData.description} onChange={handleFormChange} />
                        </Form.Group>

                        <Form.Group className="mb-4">
                            <Form.Label className="text-muted">Imagen de portada</Form.Label>
                            <Form.Control type="file" accept="image/*" className="gv-form-input gv-file-input" onChange={handleFileChange} />
                            {/* Mostramos aviso de si ya hay una imagen guardada cuando estamos editando */}
                            {editingGame && editingGame.image && <small className="text-muted d-block mt-2"><i className="bi bi-info-circle me-1"></i> Imagen actual: {editingGame.image}</small>}
                        </Form.Group>
                        
                        <div className="d-flex justify-content-end border-top border-secondary pt-3 mt-4">
                            <button type="button" className="gv-btn-cancel me-3" onClick={handleCloseForm}>Cancelar</button>
                            <button type="submit" className="gv-btn-purple">Guardar cambios</button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default AdminPanel;