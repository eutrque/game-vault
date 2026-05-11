import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Spinner, Form } from 'react-bootstrap';
import axios from 'axios';

import '../styles/GameDetail.css';

const GameDetail = () => {
    const { id } = useParams(); 
    const navigate = useNavigate();
    const API_URL = "http://localhost:3000";
    const userId = localStorage.getItem('userId');

    const [game, setGame] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isInLibrary, setIsInLibrary] = useState(false);
    const [reviews, setReviews] = useState([]);
    const [developerGames, setDeveloperGames] = useState([]); 
    
    // Separamos los inputs del muro y de las respuestas para que no se pisen al escribir
    const [gameComments, setGameComments] = useState([]); 
    const [reviewComments, setReviewComments] = useState({}); 
    const [activeReplyBox, setActiveReplyBox] = useState(null); 
    const [newComment, setNewComment] = useState(""); 
    const [replyText, setReplyText] = useState("");   
    
    const [showAddForm, setShowAddForm] = useState(false);
    const [libraryData, setLibraryData] = useState({
        status: 'pending',
        hours_played: 0,
        personal_rating: 10
    });

    const [expandedReviews, setExpandedReviews] = useState({});
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [hasReviewed, setHasReviewed] = useState(false); 
    const [userReviewData, setUserReviewData] = useState({
        id: null, title: '', content: '', rating: 50 
    });

    const toggleExpandReview = (reviewId) => {
        setExpandedReviews(prevState => ({ ...prevState, [reviewId]: !prevState[reviewId] }));
    };

    // Traemos toda la info: juego, reseñas e hilos de comentarios
    useEffect(() => {
        window.scrollTo(0, 0); 
        const fetchAllGameData = async () => {
            setLoading(true);
            try {
                const gameRes = await axios.get(`${API_URL}/api/games/${id}`);
                setGame(gameRes.data);

                try {
                    const revRes = await axios.get(`${API_URL}/api/reviews/game/${id}`);
                    const allReviews = revRes.data;
                    setReviews(allReviews);

                    // Si está logueado, miramos si ya tiene reseña para activar el modo edición
                    if (userId) {
                        const myRev = allReviews.find(r => r.user_id === parseInt(userId, 10));
                        if (myRev) {
                            setHasReviewed(true);
                            setUserReviewData({ id: myRev.id, title: myRev.title, content: myRev.content, rating: myRev.rating });
                        }
                    }

                    // Cargamos los hilos de cada reseña de forma paralela
                    const promises = allReviews.map(r => 
                        axios.get(`${API_URL}/api/comments/review/game/${r.id}`)
                            .then(res => ({ id: r.id, data: res.data }))
                            .catch((err) => { console.error(err); return { id: r.id, data: [] }; })
                    );
                    const resits = await Promise.all(promises);
                    const map = {};
                    resits.forEach(r => { map[r.id] = r.data; });
                    setReviewComments(map);

                } catch (err) { console.error(err); }

                // Comentarios del muro general
                try {
                    const muroRes = await axios.get(`${API_URL}/api/comments/game/${id}`);
                    setGameComments(muroRes.data);
                } catch (err) { console.error(err); }

                if (userId) {
                    try {
                        const libRes = await axios.get(`${API_URL}/api/library/${userId}/check/${id}`);
                        setIsInLibrary(libRes.data.exists);
                    } catch (err) { console.error(err); }
                }

                if (gameRes.data.developer_id) {
                    try {
                        const devRes = await axios.get(`${API_URL}/api/games/developer/${gameRes.data.developer_id}`);
                        setDeveloperGames(devRes.data.filter(item => item.id !== parseInt(id)));
                    } catch (err) { console.error(err); }
                }
            } catch (err) { console.error(err); } finally { setLoading(false); }
        };
        fetchAllGameData();
    }, [id, userId, API_URL]);

    // Publicar en el muro general del juego
    const handlePostGameComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        try {
            await axios.post(`${API_URL}/api/comments/game`, { user_id: userId, game_id: id, content: newComment });
            setNewComment("");
            const res = await axios.get(`${API_URL}/api/comments/game/${id}`);
            setGameComments(res.data);
        } catch (err) { console.error(err); }
    };

    // Publicar respuesta a una reseña específica
    const handlePostReviewComment = async (reviewId) => {
        if (!replyText.trim()) return;
        try {
            await axios.post(`${API_URL}/api/comments/review/game`, { user_id: userId, review_id: reviewId, content: replyText });
            setReplyText(""); 
            setActiveReplyBox(null);
            const res = await axios.get(`${API_URL}/api/comments/review/game/${reviewId}`);
            setReviewComments(prev => ({ ...prev, [reviewId]: res.data }));
        } catch (err) { console.error(err); }
    };

    const handleAddToLibrary = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_URL}/api/library/${userId}/add`, { game_id: id, ...libraryData });
            setIsInLibrary(true); setShowAddForm(false); 
        } catch (err) { console.error(err); alert("Error al guardar"); }
    };

    // Si ya existe la reseña la edita (PUT), si no, la crea (POST)
    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        if(!userReviewData.title.trim() || !userReviewData.content.trim()) return alert("Campos obligatorios");
        try {
            if (hasReviewed) {
                await axios.put(`${API_URL}/api/reviews/game/${userReviewData.id}`, userReviewData);
                setReviews(reviews.map(r => r.id === userReviewData.id ? { ...r, ...userReviewData } : r));
            } else {
                const res = await axios.post(`${API_URL}/api/reviews`, { user_id: userId, game_id: id, ...userReviewData });
                setReviews([{ id: res.data.insertId, user_id: parseInt(userId), nickname: res.data.nickname, avatar_img: res.data.avatar_img, ...userReviewData, publish_date: new Date().toISOString() }, ...reviews]);
                setHasReviewed(true);
            }
            setShowReviewForm(false);
        } catch (err) { console.error(err); }
    };

    if (loading) return <div className="gv-detail-wrapper d-flex justify-content-center pt-5"><Spinner animation="border" variant="primary" /></div>;

    return (
        <div className="gv-detail-wrapper">
            <Container className="pt-5 pb-5" style={{ maxWidth: '1450px' }}>
                <Row className="g-4">
                    <Col lg={8}>
                        <div className="gv-detail-hero">
                            <img src={`${API_URL}/images/games/${game.image}`} alt={game.title} className="gv-detail-hero-img" />
                            <div className="gv-detail-hero-overlay">
                                <div className="gv-tag-group">
                                    {game.genres?.map((g, i) => <span key={i} className="gv-tag genre">{g}</span>)}
                                </div>
                                <h1 className="gv-detail-title">{game.title}</h1>
                                <div className="gv-detail-meta d-flex align-items-center flex-wrap gap-4">
                                    <span><i className="bi bi-building"></i>{game.developer_name}</span>
                                    <span><i className="bi bi-calendar3"></i>{new Date(game.release_date).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>

                        <div className="gv-box mb-4">
                            <h3 className="gv-box-title">Acerca del juego</h3>
                            <p className="gv-box-text mb-0" style={{ color: '#e0e0e0', fontSize: '1.05rem' }}>{game.description}</p>
                        </div>

                        {/* --- SECCIÓN COMENTARIOS CON CONTADOR VISIBLE --- */}
                        <div className="gv-box mb-4">
                            <h3 className="gv-box-title">Comentarios</h3>
                            {userId && (
                                <Form onSubmit={handlePostGameComment} className="mb-4">
                                    <Form.Control 
                                        as="textarea" rows={2} className="gv-input-dark mb-2" 
                                        placeholder="Deja un comentario o pregunta sobre este juego..." 
                                        style={{ color: 'white' }}
                                        maxLength={500}
                                        value={newComment} onChange={(e) => setNewComment(e.target.value)}
                                    />
                                    <div className="d-flex justify-content-between align-items-center">
                                        <span style={{ color: '#888', fontSize: '0.8rem' }}>{newComment.length} / 500</span>
                                        <button className="gv-btn-publish py-1 px-3 fs-6" type="submit">Comentar</button>
                                    </div>
                                </Form>
                            )}
                            <div className="gv-comment-list">
                                {gameComments.map(c => (
                                    <div key={c.id} className="gv-comment-item-simple">
                                        <img src={`${API_URL}/images/avatars/${c.avatar_img || 'avatar4.jpg'}`} className="gv-comment-avatar-mini" alt="u" />
                                        <div className="gv-comment-content-mini">
                                            <p className="m-0 text-white fw-bold small">
                                                <span style={{ color: '#c084fc' }}>{c.nickname}</span> 
                                                <span className="ms-2" style={{ color: '#666', fontSize: '0.75rem' }}>{new Date(c.publish_date).toLocaleDateString()}</span>
                                            </p>
                                            <p className="m-0 mt-1" style={{ color: '#f0f0f0', fontSize: '1rem' }}>{c.content}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {showReviewForm && (
                            <div className="gv-review-form-container mb-5">
                                <h4 className="gv-review-form-title"><i className="bi bi-pencil-square" style={{color: '#c084fc'}}></i> {hasReviewed ? 'Editar Reseña' : 'Añadir Reseña'}</h4>
                                <Form onSubmit={handleReviewSubmit}>
                                    <Form.Group className="mb-4 gv-rating-input-wrapper">
                                        <Form.Label className="text-white small fw-bold">Puntuación (0-100)</Form.Label>
                                        <Form.Control type="number" min="0" max="100" className="gv-review-input" value={userReviewData.rating} onChange={(e) => setUserReviewData({...userReviewData, rating: e.target.value})} required />
                                    </Form.Group>
                                    <Form.Group className="mb-4">
                                        <Form.Label className="text-white small fw-bold">Título *</Form.Label>
                                        <Form.Control type="text" className="gv-review-input" value={userReviewData.title} onChange={(e) => setUserReviewData({...userReviewData, title: e.target.value})} required />
                                    </Form.Group>
                                    <Form.Group className="mb-4">
                                        <Form.Label className="text-white small fw-bold">Comentario</Form.Label>
                                        <Form.Control 
                                            as="textarea" rows={5} className="gv-review-input" 
                                            style={{resize: 'none'}} 
                                            maxLength={5000}
                                            value={userReviewData.content} 
                                            onChange={(e) => setUserReviewData({...userReviewData, content: e.target.value})} 
                                            required 
                                        />
                                        <div className="text-end mt-1">
                                            <span style={{ color: '#888', fontSize: '0.8rem' }}>{userReviewData.content.length} / 5000</span>
                                        </div>
                                    </Form.Group>
                                    <div className="d-flex justify-content-end gap-3">
                                        <button type="button" className="gv-btn-cancel" onClick={() => setShowReviewForm(false)}>Cancelar</button>
                                        <button type="submit" className="gv-btn-publish">{hasReviewed ? 'Guardar' : 'Publicar'}</button>
                                    </div>
                                </Form>
                            </div>
                        )}

                        <div className="mt-5">
                            <h3 className="text-white fw-bold mb-4"><i className="bi bi-chat-left-text-fill me-3" style={{color: '#c084fc'}}></i> Reseñas</h3>
                            {reviews.map(reviewItem => {
                                const isExp = expandedReviews[reviewItem.id];
                                const textToShow = (reviewItem.content.length > 300 && !isExp) ? reviewItem.content.substring(0, 300) + "..." : reviewItem.content;
                                return (
                                    <div key={reviewItem.id} className="gv-review-card">
                                        <div className="d-flex justify-content-between">
                                            <div className="gv-review-user">
                                                <img src={`${API_URL}/images/avatars/${reviewItem.avatar_img || 'avatar4.jpg'}`} className="gv-review-avatar" alt="v" />
                                                <div><p className="text-white fw-bold m-0">{reviewItem.nickname}</p><span className="gv-review-date">{new Date(reviewItem.publish_date).toLocaleDateString()}</span></div>
                                            </div>
                                            <div className="gv-review-badge">⭐ {reviewItem.rating}/100</div>
                                        </div>
                                        <p className="text-white fw-bold mt-3 mb-1">{reviewItem.title}</p>
                                        <p className="m-0" style={{ color: '#e0e0e0', fontSize: '1.05rem', lineHeight: '1.6' }}>{textToShow} {reviewItem.content.length > 300 && <button className="gv-read-more-btn" onClick={() => toggleExpandReview(reviewItem.id)}>{isExp ? "Leer menos" : "Leer más"}</button>}</p>
                                        
                                        <div className="gv-review-replies mt-4">
                                            {reviewComments[reviewItem.id]?.map(reply => (
                                                <div key={reply.id} className="gv-reply-item d-flex gap-3 mb-3">
                                                    <img src={`${API_URL}/images/avatars/${reply.avatar_img || 'avatar4.jpg'}`} className="gv-reply-avatar-mini" alt="u" />
                                                    <div>
                                                        <p className="m-0 fw-bold small" style={{ color: '#c084fc' }}>
                                                            {reply.nickname} 
                                                            <span className="ms-2" style={{ color: '#666', fontWeight: 'normal' }}>{new Date(reply.publish_date).toLocaleDateString()}</span>
                                                        </p>
                                                        <p className="m-0 mt-1" style={{ color: '#d1d1d1', fontSize: '0.95rem' }}>{reply.content}</p>
                                                    </div>
                                                </div>
                                            ))}
                                            {userId && (
                                                <div className="mt-3">
                                                    {activeReplyBox === reviewItem.id ? (
                                                        <div className="d-flex flex-column gap-2">
                                                            <div className="d-flex gap-2">
                                                                <Form.Control 
                                                                    size="sm" className="gv-input-dark" placeholder="Escribe tu respuesta..."
                                                                    maxLength={500}
                                                                    value={replyText} onChange={(e) => setReplyText(e.target.value)}
                                                                />
                                                                <button className="gv-btn-send-reply" onClick={() => handlePostReviewComment(reviewItem.id)}>Enviar</button>
                                                                <button className="btn btn-sm btn-link text-secondary" onClick={() => { setActiveReplyBox(null); setReplyText(""); }}>X</button>
                                                            </div>
                                                            <span style={{ color: '#888', fontSize: '0.75rem', textAlign: 'right' }}>{replyText.length} / 500</span>
                                                        </div>
                                                    ) : <button className="gv-reply-btn" onClick={() => setActiveReplyBox(reviewItem.id)}><i className="bi bi-reply-fill"></i> Responder a la reseña</button>}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </Col>

                    <Col lg={4}>
                        <div className="gv-box gv-rating-box mb-4">
                            <div className="gv-rating-label">Nota Media</div>
                            <div className="gv-rating-display"><i className="bi bi-star-fill gv-rating-star-big"></i><div className="gv-rating-score-text">{Number(game.average_rating || 0).toFixed(1)}<span className="gv-rating-max-small">/10</span></div></div>
                        </div>

                        <div className="gv-box">
                            <h3 className="gv-box-title fs-5 mb-4">Gestión de Biblioteca</h3>
                            {!userId ? <button className="btn-manage-main" onClick={() => navigate('/login')}>Iniciar Sesión</button> : (
                                <div>
                                    {isInLibrary ? (
                                        <div className="text-center py-2">
                                            <i className="bi bi-bookmark-check-fill text-success mb-2 d-block" style={{fontSize: '2.5rem'}}></i>
                                            <span className="text-white fw-bold">Ya en la Biblioteca</span>
                                        </div>
                                    ) : (
                                        <>
                                            {!showAddForm ? (
                                                <button className="btn-manage-main" onClick={() => setShowAddForm(true)}>
                                                    <i className="bi bi-plus-lg me-2"></i> Añadir Juego
                                                </button>
                                            ) : (
                                                <div className="gv-add-form-container">
                                                    <div className="d-flex justify-content-between mb-4">
                                                        <span className="text-white fw-bold small">Detalles del Registro</span>
                                                        <i className="bi bi-x-lg cursor-pointer text-muted" onClick={() => setShowAddForm(false)}></i>
                                                    </div>
                                                    <Form onSubmit={handleAddToLibrary}>
                                                        <Form.Group className="mb-3">
                                                            <Form.Label>Estado de Progreso</Form.Label>
                                                            <Form.Select className="gv-input-dark" value={libraryData.status} onChange={e => {
                                                                    const s = e.target.value;
                                                                    setLibraryData({...libraryData, status: s, hours_played: s === 'pending' ? 0 : libraryData.hours_played, personal_rating: s === 'pending' ? '' : libraryData.personal_rating});
                                                                }}>
                                                                <option value="pending">Pendiente</option><option value="playing">Jugando</option><option value="completed">Completado</option><option value="abandoned">Abandonado</option>
                                                            </Form.Select>
                                                        </Form.Group>
                                                        <Row className="g-2 mb-3">
                                                            <Col xs={6}>
                                                                <Form.Label>Tiempo (Horas)</Form.Label>
                                                                <Form.Control 
                                                                    type="number" className="gv-input-dark" 
                                                                    value={libraryData.status === 'pending' ? 0 : libraryData.hours_played} 
                                                                    onChange={e => {
                                                                        if (libraryData.status !== 'pending') {
                                                                            setLibraryData({...libraryData, hours_played: e.target.value});
                                                                        }
                                                                    }} 
                                                                    disabled={libraryData.status === 'pending'} /* PRIMER Y SEGUNDO CANDADO */
                                                                    readOnly={libraryData.status === 'pending'} 
                                                                />
                                                            </Col>
                                                            <Col xs={6}>
                                                                <Form.Label>Calificación Personal</Form.Label>
                                                                <div className="gv-input-icon-wrapper">
                                                                    <Form.Control 
                                                                        type="number" max="10" min="1" className="gv-input-dark with-icon" 
                                                                        value={libraryData.status === 'pending' ? '' : libraryData.personal_rating} 
                                                                        onChange={e => {
                                                                            if (libraryData.status !== 'pending') {
                                                                                setLibraryData({...libraryData, personal_rating: e.target.value});
                                                                            }
                                                                        }} 
                                                                        disabled={libraryData.status === 'pending'} /* PRIMER Y SEGUNDO CANDADO */
                                                                        readOnly={libraryData.status === 'pending'} 
                                                                    />
                                                                    <i className="bi bi-star-fill" style={{ opacity: libraryData.status === 'pending' ? 0.3 : 1 }}></i>
                                                                </div>
                                                            </Col>
                                                        </Row>
                                                        <button type="submit" className="btn-manage-main py-2">Confirmar</button>
                                                    </Form>
                                                </div>
                                            )}
                                        </>
                                    )}
                                    <button className="btn-manage-secondary mt-3" onClick={() => setShowReviewForm(!showReviewForm)}><i className="bi bi-pencil-square me-2"></i> {hasReviewed ? 'Modificar Reseña' : 'Publicar Reseña'}</button>
                                </div>
                            )}
                        </div>
                    </Col>
                </Row>
                
                {developerGames.length > 0 && (
                    <div className="mt-5 pt-5">
                        <h3 className="text-white fw-bold mb-4">Más juegos de {game.developer_name}</h3>
                        <Row className="g-4">{developerGames.slice(0, 4).map(rg => (
                            <Col key={rg.id} xs={12} sm={6} lg={3}><div className="gv-dev-game-card h-100" onClick={() => navigate(`/game/${rg.id}`)}><img src={`${API_URL}/images/games/${rg.image}`} className="gv-dev-game-img" alt="r" /><div className="p-3"><p className="text-white fw-bold fs-6 text-truncate m-0">{rg.title}</p></div></div></Col>
                        ))}</Row>
                    </div>
                )}
            </Container>
        </div>
    );
};

export default GameDetail;