import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Form, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/Profile.css';

const Profile = () => {
    const navigate = useNavigate();
    const API_URL = "http://localhost:3000";

    // Referencia para el input de archivo oculto
    const fileInputRef = useRef(null);

    // Datos de perfil de usuario
    const [userData, setUserData] = useState({
        nickname: '', email: '', bio: '', avatar_img: '', role: '', registration_date: ''
    });

    const [editData, setEditData] = useState({
        nickname: '', bio: ''
    });

    const [stats, setStats] = useState({
        total_games: 0, total_reviews: 0, total_hours: 0, completed_games: 0
    });

    const [loading, setLoading] = useState(true);

    // Cargamos todo al entrar
    useEffect(() => {
        const fetchAllData = async () => {
            const userId = localStorage.getItem('userId');
            if (!userId) { navigate('/login'); return; }

            try {
                const [userRes, statsRes] = await Promise.all([
                    axios.get(`${API_URL}/api/users/${userId}`),
                    axios.get(`${API_URL}/api/users/${userId}/stats`)
                ]);

                setUserData(userRes.data);
                // Inicializamos los inputs con lo que ya hay en la BD
                // Añadimos || '' para evitar errores si los campos son NULL en la base de datos
                setEditData({
                    nickname: userRes.data.nickname || '',
                    bio: userRes.data.bio || ''
                });
                setStats(statsRes.data);
            } catch (error) {
                console.error("Error cargando el perfil:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchAllData();
    }, [navigate]);

    // Actualiza el borrador mientras tecleas
    const handleInputChange = (e) => {
        setEditData({ ...editData, [e.target.name]: e.target.value });
    };

    // Maneja la subida del nuevo avatar
    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Preparamos los datos para enviarlos al servidor como archivo
        const formData = new FormData();
        formData.append('avatar', file);

        try {
            const userId = localStorage.getItem('userId');
            const res = await axios.put(`${API_URL}/api/users/${userId}/avatar`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            // Actualizamos el estado con el nuevo nombre que nos devuelve el servidor
            setUserData({ ...userData, avatar_img: res.data.avatar_img });
            
            // Actualizamos también el localStorage por si lo usas en el Navbar
            localStorage.setItem('avatar_img', res.data.avatar_img);
            window.dispatchEvent(new Event("storage"));

            alert("Foto de perfil actualizada correctamente.");
        } catch (error) {
            console.error("Error al subir la imagen:", error);
            alert("Hubo un problema al subir la nueva foto.");
        }
    };

    const handleSave = async (e) => {
        if (e) e.preventDefault();
        const userId = localStorage.getItem('userId');
        
        
        // Check para la Bio (Permitimos tildes, eñes, espacios y puntuación)
        if (editData.bio) {
            const bioRegex = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s.,!?;:()]+$/;
            if (!bioRegex.test(editData.bio)) {
                alert("La biografía tiene caracteres raros. Quita símbolos como < > / * =");
                return;
            }
        }

        try {
            // Guardamos en la base de datos (SOLO mandamos la bio y el avatar, respetando el nickname original)
            await axios.put(`${API_URL}/api/users/${userId}`, {
                nickname: userData.nickname, // Mantenemos el que ya tenía en la BD
                bio: editData.bio,
                avatar_img: userData.avatar_img 
            });
            
            // Actualizamos la interfaz (Solo la bio cambia visualmente)
            setUserData({ ...userData, bio: editData.bio });

            alert("Perfil actualizado correctamente.");

        } catch (err) {
            console.error("Error al guardar:", err);
            alert("No se ha podido guardar. Revisa la conexión.");
        }
    };

    // Al salir, volvemos a la Home
    const handleLogout = () => {
        localStorage.clear();
        navigate('/'); 
    };

    if (loading) return <div className="text-center pt-5 text-white"><Spinner animation="border" variant="primary" /></div>;

    return (
        <div className="gv-profile-wrapper">
            <Container className="pt-5">
                <div className="gv-profile-header mb-5">
                    <h1 className="gv-profile-title">
                        <i className="bi bi-shield-check text-purple"></i> Perfil de Jugador
                    </h1>
                    <div className="d-flex gap-3">
                        {userData.role === 'admin' && (
                            <button className="gv-btn-admin" onClick={() => navigate('/admin')}>
                                <i className="bi bi-gear"></i> Panel de Admin
                            </button>
                        )}
                        <button className="gv-btn-logout" onClick={handleLogout}>
                            <i className="bi bi-power"></i> Cerrar Sesión
                        </button>
                    </div>
                </div>

                <Row className="g-4">
                    {/* TARJETA IZQUIERDA: IDENTIDAD + FORMULARIO */}
                    <Col lg={5}>
                        <div className="gv-card-profile">
                            <div className="text-center mb-4">
                                <div className="gv-avatar-clean">
                                    <img 
                                        src={`${API_URL}/images/avatars/${userData.avatar_img}`} 
                                        alt="Avatar" 
                                        className="gv-avatar-img-fit" 
                                    />
                                </div>
                                
                                {/* Input oculto para subir archivo */}
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    style={{ display: 'none' }} 
                                    onChange={handleFileChange}
                                    accept="image/*"
                                />

                                <button 
                                    className="gv-btn-change-photo-sutil mt-3"
                                    onClick={() => fileInputRef.current.click()} // Dispara el click del input oculto
                                >
                                    Cambiar Foto
                                </button>

                                <h2 className="mt-3 fw-bold text-white">{userData.nickname}</h2>
                                <p className="gv-bio-preview">"{userData.bio || ''}"</p>
                            </div>

                            <hr className="gv-divider-sutil" />

                            <Form onSubmit={handleSave} className="mt-4">
                                <h4 className="fs-5 fw-bold mb-4 text-white">Información del Perfil</h4>
                                
                                <Form.Group className="mb-3">
                                    <label className="gv-form-label">Apodo (Nickname)</label>
                                    <Form.Control 
                                        type="text" name="nickname" className="gv-input-dark shadow-none" 
                                        value={editData.nickname} 
                                        disabled // Campo bloqueado por seguridad
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <label className="gv-form-label">Correo Electrónico</label>
                                    <Form.Control 
                                        type="email" className="gv-input-dark" 
                                        value={userData.email} disabled 
                                    />
                                </Form.Group>

                                <Form.Group className="mb-4">
                                    <label className="gv-form-label">Biografía</label>
                                    <Form.Control 
                                        as="textarea" name="bio" rows={4} className="gv-input-dark shadow-none" 
                                        value={editData.bio} onChange={handleInputChange} 
                                        maxLength="150"
                                    />
                                    <div className="text-end mt-1">
                                        <small className="text-white-50">{(editData.bio || "").length}/150</small>
                                    </div>
                                </Form.Group>

                                <div className="gv-member-tag mb-4">
                                    <i className="bi bi-calendar3"></i>
                                    <span>Miembro desde: <strong>{new Date(userData.registration_date).toLocaleDateString()}</strong></span>
                                </div>

                                <button type="submit" className="gv-btn-save-final">Guardar Cambios</button>
                            </Form>
                        </div>
                    </Col>

                    {/* TARJETA DERECHA: STATS */}
                    <Col lg={7}>
                        <div className="gv-card-profile h-100">
                            <h4 className="mb-5 fw-bold text-white d-flex align-items-center gap-2">
                                <i className="bi bi-trophy text-purple"></i> Estadísticas de Juego
                            </h4>
                            <div className="gv-stats-grid">
                                <div className="gv-stat-box-item">
                                    <div className="gv-stat-ico purple"><i className="bi bi-collection-play"></i></div>
                                    <div className="gv-stat-texts">
                                        <span className="gv-stat-label-text">Juegos en Bóveda</span>
                                        <span className="gv-stat-number-text">{stats.total_games}</span>
                                    </div>
                                </div>
                                <div className="gv-stat-box-item">
                                    <div className="gv-stat-ico green"><i className="bi bi-chat-dots"></i></div>
                                    <div className="gv-stat-texts">
                                        <span className="gv-stat-label-text">Reseñas Escritas</span>
                                        <span className="gv-stat-number-text">{stats.total_reviews}</span>
                                    </div>
                                </div>
                                <div className="gv-stat-box-item">
                                    <div className="gv-stat-ico blue"><i className="bi bi-stopwatch"></i></div>
                                    <div className="gv-stat-texts">
                                        <span className="gv-stat-label-text">Horas Totales</span>
                                        <span className="gv-stat-number-text">{stats.total_hours}h</span>
                                    </div>
                                </div>
                                <div className="gv-stat-box-item">
                                    <div className="gv-stat-ico orange"><i className="bi bi-check-circle"></i></div>
                                    <div className="gv-stat-info">
                                        <span className="gv-stat-label-text">Juegos Completados</span>
                                        <span className="gv-stat-number-text">{stats.completed_games}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Col>
                </Row>
            </Container>
        </div>
    );
};

export default Profile;