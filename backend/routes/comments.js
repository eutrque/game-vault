const express = require('express');
const router = express.Router();
const db = require('../db');


// Comentarios e hilos en juegos

// Leer comentarios de un juego
router.get('/game/:id', async (req, res) => {
    try {
        // Traemos también el parent_id para que React sepa si es una respuesta
        const sql = `
            SELECT c.id, c.content, c.publish_date, c.parent_id, u.nickname, u.avatar_img 
            FROM Game_Comments c
            JOIN Users u ON c.user_id = u.id
            WHERE c.game_id = ?
            ORDER BY c.publish_date DESC`;
        const [rows] = await db.query(sql, [req.params.id]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Escribir comentario o respuesta en un juego
router.post('/game', async (req, res) => {
    // Recibimos el parent_id. Si es un comentario normal, llegará vacío 
    const { user_id, game_id, content, parent_id } = req.body;
    
    if (!content || content.trim() === '') return res.status(400).json({ error: "El comentario no puede estar vacío" });

    try {
        const sql = `INSERT INTO Game_Comments (user_id, game_id, content, parent_id) VALUES (?, ?, ?, ?)`;
        // Si parent_id existe lo guardamos, si no, guardamos null (comentario principal)
        await db.query(sql, [user_id, game_id, content, parent_id || null]);
        res.status(201).json({ message: "Comentario publicado" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// Comentarios e hilos en mangas


// Leer comentarios de un manga
router.get('/manga/:id', async (req, res) => {
    try {
        const sql = `
            SELECT c.id, c.content, c.publish_date, c.parent_id, u.nickname, u.avatar_img 
            FROM Manga_Comments c
            JOIN Users u ON c.user_id = u.id
            WHERE c.manga_id = ?
            ORDER BY c.publish_date DESC`;
        const [rows] = await db.query(sql, [req.params.id]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Escribir comentario o respuesta en un manga
router.post('/manga', async (req, res) => {
    const { user_id, manga_id, content, parent_id } = req.body;
    if (!content || content.trim() === '') return res.status(400).json({ error: "El comentario no puede estar vacío" });

    try {
        const sql = `INSERT INTO Manga_Comments (user_id, manga_id, content, parent_id) VALUES (?, ?, ?, ?)`;
        await db.query(sql, [user_id, manga_id, content, parent_id || null]);
        res.status(201).json({ message: "Comentario publicado" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// Hilos de respuestas en reseñas en juegos


// Leer comentarios de una reseña específica (Juegos)
router.get('/review/game/:review_id', async (req, res) => {
    try {
        const sql = `
            SELECT c.id, c.content, c.publish_date, c.parent_id, u.nickname, u.avatar_img 
            FROM Game_Review_Comments c
            JOIN Users u ON c.user_id = u.id
            WHERE c.review_id = ?
            ORDER BY c.publish_date ASC`; 
        const [rows] = await db.query(sql, [req.params.review_id]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Responder a una reseña de juego
router.post('/review/game', async (req, res) => {
    const { user_id, review_id, content, parent_id } = req.body;
    try {
        const sql = `INSERT INTO Game_Review_Comments (user_id, review_id, content, parent_id) VALUES (?, ?, ?, ?)`;
        await db.query(sql, [user_id, review_id, content, parent_id || null]);
        res.status(201).json({ message: "Respuesta publicada" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// Hilos de respuestas de reseñas en mangas


// Leer comentarios de una reseña específica (Mangas)
router.get('/review/manga/:review_id', async (req, res) => {
    try {
        const sql = `
            SELECT c.id, c.content, c.publish_date, c.parent_id, u.nickname, u.avatar_img 
            FROM Manga_Review_Comments c
            JOIN Users u ON c.user_id = u.id
            WHERE c.review_id = ?
            ORDER BY c.publish_date ASC`;
        const [rows] = await db.query(sql, [req.params.review_id]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Responder a una reseña de manga
router.post('/review/manga', async (req, res) => {
    const { user_id, review_id, content, parent_id } = req.body;
    try {
        const sql = `INSERT INTO Manga_Review_Comments (user_id, review_id, content, parent_id) VALUES (?, ?, ?, ?)`;
        await db.query(sql, [user_id, review_id, content, parent_id || null]);
        res.status(201).json({ message: "Respuesta publicada" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;