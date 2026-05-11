const express = require('express');
const router = express.Router();
const db = require('../db');

// Stats biblioteca
router.get('/:user_id/stats', async (req, res) => {
    try {
        const sql = `
            SELECT 
                COUNT(gl.game_id) as total_games,
                SUM(CASE WHEN gl.status = 'completed' THEN 1 ELSE 0 END) as completed_games,
                COALESCE(SUM(gl.hours_played), 0) as total_hours
            FROM games_library gl
            JOIN Library l ON gl.library_id = l.id
            WHERE l.user_id = ?`;
            
        const [rows] = await db.query(sql, [req.params.user_id]);
        res.json(rows[0]); 
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// Lista de juegos de la biblioteca del usuario
router.get('/:user_id', async (req, res) => {
    const { search, status, genreid, sort } = req.query;

    try {
        let sql = `
            SELECT gl.id as entry_id, gl.status, gl.hours_played, gl.personal_rating, gl.date_added,
                   g.id as game_id, g.title, g.image
            FROM games_library gl
            JOIN Library l ON gl.library_id = l.id
            JOIN Games g ON gl.game_id = g.id
            WHERE l.user_id = ?`;
        
        let params = [req.params.user_id];

        if (search) {
            sql += ` AND g.title LIKE ?`;
            params.push(`%${search}%`);
        }
        if (status && status !== 'Todos') {
            sql += ` AND gl.status = ?`;
            params.push(status);
        }
        if (genreid && genreid !== 'Todos') {
            sql += ` AND g.id IN (SELECT game_id FROM Game_Genres WHERE genre_id = ?)`;
            params.push(genreid);
        }

        if (sort === 'title') sql += ` ORDER BY g.title ASC`;
        else if (sort === 'hours') sql += ` ORDER BY gl.hours_played DESC`;
        else if (sort === 'rating') sql += ` ORDER BY gl.personal_rating DESC`;
        else sql += ` ORDER BY gl.date_added DESC`;

        const [rows] = await db.query(sql, params);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Comprobar si el juego ya esta en la biblioteca
router.get('/:user_id/check/:game_id', async (req, res) => {
    try {
        const { user_id, game_id } = req.params;
        const sql = `
            SELECT gl.id FROM games_library gl
            JOIN Library l ON gl.library_id = l.id
            WHERE l.user_id = ? AND gl.game_id = ?`;
        const [rows] = await db.query(sql, [user_id, game_id]);
        res.json({ exists: rows.length > 0 });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// Añadir juego a la biblioteca
router.post('/:user_id/add', async (req, res) => {
    const { user_id } = req.params;
    const { game_id, status, hours_played, personal_rating } = req.body;

    try {
        let [libRows] = await db.query('SELECT id FROM Library WHERE user_id = ?', [user_id]);
        let library_id;

        if (libRows.length === 0) {
            const [newLib] = await db.query('INSERT INTO Library (user_id, name) VALUES (?, ?)', [user_id, 'Mi Colección']);
            library_id = newLib.insertId;
        } else {
            library_id = libRows[0].id;
        }

        // Si viene vacío o null, lo forzamos a 0 para que la base de datos no se queje
        const finalHours = hours_played ? hours_played : 0;
        const finalRating = personal_rating ? personal_rating : 0;

        const sql = `INSERT INTO games_library (library_id, game_id, status, hours_played, personal_rating) 
                     VALUES (?, ?, ?, ?, ?)`;
        await db.query(sql, [library_id, game_id, status, finalHours, finalRating]);
        
        res.status(201).json({ message: "¡Juego añadido a tu biblioteca!" });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            res.status(400).json({ error: "Este juego ya está en tu biblioteca." });
        } else {
            console.log("ERROR DEL SERVIDOR:", err.message); 
            res.status(500).json({ error: err.message });
        }
    }
});

// Editar datos de un juego en la biblioteca
router.put('/:user_id/:game_id', async (req, res) => {
    const { status, hours_played, personal_rating } = req.body;
    
    try {
        const sql = `
            UPDATE games_library gl
            JOIN Library l ON gl.library_id = l.id
            SET gl.status = ?, gl.hours_played = ?, gl.personal_rating = ?
            WHERE l.user_id = ? AND gl.game_id = ?`;
            
        const [result] = await db.query(sql, [status, hours_played, personal_rating, req.params.user_id, req.params.game_id]);
        
        if (result.affectedRows === 0) return res.status(404).json({ message: "Juego no encontrado en tu biblioteca" });
        res.json({ message: "Datos actualizados correctamente" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// Borrar un juego de la biblioteca
router.delete('/:user_id/:game_id', async (req, res) => {
    try {
        const sql = `
            DELETE gl FROM games_library gl
            JOIN Library l ON gl.library_id = l.id
            WHERE l.user_id = ? AND gl.game_id = ?`;
            
        const [result] = await db.query(sql, [req.params.user_id, req.params.game_id]);
        
        if (result.affectedRows === 0) return res.status(404).json({ message: "El juego no estaba en tu biblioteca" });
        res.json({ message: "Juego eliminado de tu colección" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Rutas mangas

// Stats biblioteca (MANGAS)
router.get('/manga/:user_id/stats', async (req, res) => {
    try {
        const sql = `
            SELECT 
                COUNT(ml.manga_id) as total_mangas,
                SUM(CASE WHEN ml.status = 'completed' THEN 1 ELSE 0 END) as completed_mangas,
                COALESCE(SUM(ml.volumes_read), 0) as total_volumes
            FROM mangas_library ml
            JOIN Library l ON ml.library_id = l.id
            WHERE l.user_id = ?`;
            
        const [rows] = await db.query(sql, [req.params.user_id]);
        res.json(rows[0]); 
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Lista de mangas de la biblioteca del usuario
router.get('/manga/:user_id', async (req, res) => {
    const { search, status, genreid, sort } = req.query;

    try {
        let sql = `
            SELECT ml.id as entry_id, ml.status, ml.volumes_read, ml.personal_rating, ml.date_added,
                   m.id as manga_id, m.title, m.cover_image
            FROM mangas_library ml
            JOIN Library l ON ml.library_id = l.id
            JOIN Mangas m ON ml.manga_id = m.id
            WHERE l.user_id = ?`;
        
        let params = [req.params.user_id];

        if (search) {
            sql += ` AND m.title LIKE ?`;
            params.push(`%${search}%`);
        }
        if (status && status !== 'Todos') {
            sql += ` AND ml.status = ?`;
            params.push(status);
        }
        if (genreid && genreid !== 'Todos') {
            sql += ` AND m.id IN (SELECT manga_id FROM Manga_Genres WHERE genre_id = ?)`;
            params.push(genreid);
        }

        if (sort === 'title') sql += ` ORDER BY m.title ASC`;
        else if (sort === 'volumes') sql += ` ORDER BY ml.volumes_read DESC`;
        else if (sort === 'rating') sql += ` ORDER BY ml.personal_rating DESC`;
        else sql += ` ORDER BY ml.date_added DESC`;

        const [rows] = await db.query(sql, params);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Comprobar si el manga ya esta en la biblioteca
router.get('/manga/:user_id/check/:manga_id', async (req, res) => {
    try {
        const { user_id, manga_id } = req.params;
        const sql = `
            SELECT ml.id FROM mangas_library ml
            JOIN Library l ON ml.library_id = l.id
            WHERE l.user_id = ? AND ml.manga_id = ?`;
        const [rows] = await db.query(sql, [user_id, manga_id]);
        res.json({ exists: rows.length > 0 });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Añadir manga a la biblioteca
router.post('/manga/:user_id/add', async (req, res) => {
    const { user_id } = req.params;
    const { manga_id, status, volumes_read, personal_rating } = req.body;

    try {
        // Buscamos si el usuario ya tiene su biblioteca creada
        let [libRows] = await db.query('SELECT id FROM Library WHERE user_id = ?', [user_id]);
        let library_id;

        // Si no la tiene, se la creamos automáticamente sobre la marcha
        if (libRows.length === 0) {
            const [newLib] = await db.query('INSERT INTO Library (user_id, name) VALUES (?, ?)', [user_id, 'Mi Colección']);
            library_id = newLib.insertId;
        } else {
            library_id = libRows[0].id;
        }

        const finalVolumes = volumes_read ? volumes_read : 0;
        const finalRating = personal_rating ? personal_rating : 0;

        // Insertamos el manga usando el library_id seguro
        const sql = `INSERT INTO mangas_library (library_id, manga_id, status, volumes_read, personal_rating) 
                     VALUES (?, ?, ?, ?, ?)`;
        await db.query(sql, [library_id, manga_id, status, finalVolumes, finalRating]);
        
        res.status(201).json({ message: "¡Manga añadido a tu biblioteca!" });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            res.status(400).json({ error: "Este manga ya está en tu biblioteca." });
        } else {
            res.status(500).json({ error: err.message });
        }
    }
});

// Editar datos de un manga en la biblioteca
router.put('/manga/:user_id/:manga_id', async (req, res) => {
    const { status, volumes_read, personal_rating } = req.body;
    
    try {
        const sql = `
            UPDATE mangas_library ml
            JOIN Library l ON ml.library_id = l.id
            SET ml.status = ?, ml.volumes_read = ?, ml.personal_rating = ?
            WHERE l.user_id = ? AND ml.manga_id = ?`;
            
        const [result] = await db.query(sql, [status, volumes_read, personal_rating, req.params.user_id, req.params.manga_id]);
        
        if (result.affectedRows === 0) return res.status(404).json({ message: "Manga no encontrado en tu biblioteca" });
        res.json({ message: "Datos actualizados correctamente" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Borrar un manga de la biblioteca
router.delete('/manga/:user_id/:manga_id', async (req, res) => {
    try {
        const sql = `
            DELETE ml FROM mangas_library ml
            JOIN Library l ON ml.library_id = l.id
            WHERE l.user_id = ? AND ml.manga_id = ?`;
            
        const [result] = await db.query(sql, [req.params.user_id, req.params.manga_id]);
        
        if (result.affectedRows === 0) return res.status(404).json({ message: "El manga no estaba en tu biblioteca" });
        res.json({ message: "Manga eliminado de tu colección" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;