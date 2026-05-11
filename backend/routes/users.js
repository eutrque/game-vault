const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');
const path = require('path');

// Configuración de Multer para guardar y renombrar las imágenes
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images/avatars/'); 
    },
    filename: (req, file, cb) => {
        // Creamos el nombre cifrado: "avatar-" + fecha exacta + numero al azar + la extensión 
        const randomNumber = Math.round(Math.random() * 10000);
        const fileExtension = path.extname(file.originalname);
        const finalFileName = 'avatar-' + Date.now() + '-' + randomNumber + fileExtension;
        
        cb(null, finalFileName);
    }
});

// Inicializamos multer 
const upload = multer({ storage: storage });

// Datos del perfil del usuario
router.get('/:id', async (req, res) => {
    try {
        const sql = `SELECT id, username, nickname, email, bio, avatar_img, registration_date, role 
                     FROM Users WHERE id = ?`;
        const [rows] = await db.query(sql, [req.params.id]);

        if (rows.length === 0) return res.status(404).json({ message: "Usuario no encontrado" });
        
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// Estadísticas del usuario para el perfil
router.get('/:id/stats', async (req, res) => {
    try {
        const userId = req.params.id;
        // Sumamos las reseñas de Game_Reviews y Manga_Reviews.
        const sql = `
            SELECT 
                (SELECT COUNT(*) FROM Library l JOIN games_library gl ON l.id = gl.library_id WHERE l.user_id = ?) as total_games,
                (
                    (SELECT COUNT(*) FROM Game_Reviews WHERE user_id = ?) + 
                    (SELECT COUNT(*) FROM Manga_Reviews WHERE user_id = ?)
                ) as total_reviews,
                (SELECT COALESCE(SUM(gl.hours_played), 0) FROM Library l JOIN games_library gl ON l.id = gl.library_id WHERE l.user_id = ?) as total_hours,
                (SELECT COUNT(*) FROM Library l JOIN games_library gl ON l.id = gl.library_id WHERE l.user_id = ? AND gl.status = 'completed') as completed_games
        `;
        
        const [rows] = await db.query(sql, [userId, userId, userId, userId, userId]);
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// Actualizar perfil del usuario
router.put('/:id', async (req, res) => {
    const { nickname, avatar_img, bio } = req.body;
    
    try {
        const sql = `UPDATE Users SET nickname = ?, avatar_img = ?, bio = ? WHERE id = ?`;
        const [result] = await db.query(sql, [nickname, avatar_img, bio, req.params.id]);

        if (result.affectedRows === 0) return res.status(404).json({ message: "Usuario no encontrado" });
        
        res.json({ message: "¡Perfil actualizado correctamente!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Subir foto de perfil 
router.put('/:id/avatar', upload.single('avatar'), async (req, res) => {
    try {
        const userId = req.params.id;
        const newAvatar = req.file.filename; // Este es el nombre "cifrado" que generó Multer arriba

        const sql = `UPDATE Users SET avatar_img = ? WHERE id = ?`;
        const [result] = await db.query(sql, [newAvatar, userId]);

        if (result.affectedRows === 0) return res.status(404).json({ message: "Usuario no encontrado" });

        res.json({ 
            message: "Avatar actualizado con éxito", 
            avatar_img: newAvatar 
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Obtener todos los usuarios para el Panel de Admin 
router.get('/', async (req, res) => {
    try {
        // Seleccionamos los campos necesarios de todos los usuarios
        const sql = `SELECT id, username, nickname, email, role, state, registration_date 
                     FROM Users 
                     ORDER BY id DESC`;
        const [rows] = await db.query(sql);
        
        // Enviamos la lista completa al frontend
        res.json(rows);
    } catch (err) {
        console.error("Error al obtener la lista de usuarios:", err);
        res.status(500).json({ error: "Error al cargar los usuarios" });
    }
});

// Suspensión de usuarios
router.put('/:id/status', async (req, res) => {
    const { state } = req.body; // Recibe 0 o 1
    const userId = req.params.id;

    try {
        // Actualizamos el estado en la base de datos
        const sql = `UPDATE Users SET state = ? WHERE id = ?`;
        const [result] = await db.query(sql, [state, userId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        res.json({ message: "Estado del usuario actualizado con éxito" });
    } catch (err) {
        console.error("Error al actualizar estado:", err);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});
module.exports = router;