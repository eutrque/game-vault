const express = require('express');
const router = express.Router();
const db = require('../db');
const crypto = require('crypto'); 

// Generar token para compartir biblioteca
router.post('/share/:user_id', async (req, res) => {
    try {
        const token = crypto.randomBytes(16).toString('hex');
        const sql = `UPDATE Library SET share_token = ? WHERE user_id = ?`;
        const [result] = await db.query(sql, [token, req.params.user_id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: "Biblioteca no encontrada" });
        res.json({ message: "Enlace generado", token: token });
    } catch (err) {
        console.log("ERROR DEL SERVIDOR:", err.message); 
        res.status(500).json({ error: err.message });
    }
});

// Unirse a una biblioteca compartida
router.post('/join', async (req, res) => {
    const { token, guest_user_id } = req.body;
    try {
        const [libRows] = await db.query('SELECT id, user_id FROM Library WHERE share_token = ?', [token]);
        if (libRows.length === 0) return res.status(404).json({ error: "El enlace no es válido." });
        const library_id = libRows[0].id;
        if (libRows[0].user_id == guest_user_id) return res.status(400).json({ error: "No puedes unirte a tu propia biblioteca." });
        const sql = `INSERT INTO Shared_Libraries (library_id, guest_user_id) VALUES (?, ?)`;
        await db.query(sql, [library_id, guest_user_id]);
        res.status(201).json({ message: "¡Biblioteca añadida!" });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') res.status(400).json({ error: "Ya tienes esta biblioteca." });
        else res.status(500).json({ error: err.message });
    }
});

// Lista de bibliotecas compartidas con el usuario
router.get('/list/:guest_user_id', async (req, res) => {
    try {
        const sql = `
            SELECT sl.library_id, sl.access_date, u.nickname as owner_name, u.avatar_img as owner_avatar
            FROM Shared_Libraries sl
            JOIN Library l ON sl.library_id = l.id
            JOIN Users u ON l.user_id = u.id
            WHERE sl.guest_user_id = ?
            ORDER BY sl.access_date DESC`;
        const [rows] = await db.query(sql, [req.params.guest_user_id]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// Obtener el contenido detallado de una biblioteca compartida
router.get('/content/:library_id', async (req, res) => {
    const { library_id } = req.params;
    

    console.log("Cargando contenido para la biblioteca ID:", library_id);

    try {
        // Buscamos al dueño (Users + Library)
        const [ownerRows] = await db.query(
            `SELECT u.nickname, u.avatar_img FROM Library l JOIN Users u ON l.user_id = u.id WHERE l.id = ?`, 
            [library_id]
        );

        // Si esto sale vacío en la terminal, es que el ID de la URL no existe en la tabla Library
        console.log("Dueño encontrado:", ownerRows);

        // Buscamos juegos 
        const [games] = await db.query(
            `SELECT gl.*, g.title, g.image FROM games_library gl JOIN Games g ON gl.game_id = g.id WHERE gl.library_id = ?`, 
            [library_id]
        );
        
        // Buscamos mangas 
        const [mangas] = await db.query(
            `SELECT ml.*, m.title, m.cover_image FROM mangas_library ml JOIN Mangas m ON ml.manga_id = m.id WHERE ml.library_id = ?`, 
            [library_id]
        );

        // Enviamos la respuesta limpia
        res.json({ 
            owner: ownerRows[0] || { nickname: 'Amigo' }, 
            games: games || [], 
            mangas: mangas || [] 
        });
    } catch (err) {
        console.error("ERROR CRÍTICO:", err.message);
        res.status(500).json({ error: err.message });
    }
});
module.exports = router;