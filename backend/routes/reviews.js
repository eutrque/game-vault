const express = require('express');
const router = express.Router();
const db = require('../db');

// Leer reseñas de un juego (de más recientes a antiguas)
router.get('/game/:id', async (req, res) => {
    try {
        const gameId = req.params.id;
        
        // MODIFICADO: Ahora apunta a Game_Reviews
        const [rows] = await db.query(`
            SELECT r.id, r.user_id, r.title, r.content, r.rating, r.publish_date, r.update_date, u.nickname, u.avatar_img 
            FROM Game_Reviews r
            JOIN Users u ON r.user_id = u.id
            WHERE r.game_id = ?
            ORDER BY r.publish_date DESC`, 
            [gameId]
        );

        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//Leer reseñas de un manga (de más recientes a antiguas)
router.get('/manga/:id', async (req, res) => {
    try {
        const mangaId = req.params.id;
        
        const [rows] = await db.query(`
            SELECT r.id, r.user_id, r.title, r.content, r.rating, r.publish_date, r.update_date, u.nickname, u.avatar_img 
            FROM Manga_Reviews r
            JOIN Users u ON r.user_id = u.id
            WHERE r.manga_id = ?
            ORDER BY r.publish_date DESC`, 
            [mangaId]
        );

        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Crear reseña 
router.post('/', async (req, res) => {
    const { user_id, game_id, manga_id, title, content, rating } = req.body;

    // Validación de la nota (0 a 100)
    if (rating < 0 || rating > 100) {
        return res.status(400).json({ error: "La nota debe estar entre 0 y 100" });
    }

    try {
        //Lógica para decidir en qué tabla insertar
        let sql = "";
        let params = [];

        if (game_id) {
            sql = `INSERT INTO Game_Reviews (user_id, game_id, title, content, rating) VALUES (?, ?, ?, ?, ?)`;
            params = [user_id, game_id, title, content, rating];
        } else if (manga_id) {
            sql = `INSERT INTO Manga_Reviews (user_id, manga_id, title, content, rating) VALUES (?, ?, ?, ?, ?)`;
            params = [user_id, manga_id, title, content, rating];
        } else {
            return res.status(400).json({ error: "Se requiere game_id o manga_id" });
        }

        // Insertamos en la columna correspondiente (game_id o manga_id)
        const [result] = await db.query(sql, params);
        
        // Buscamos el nombre y avatar del usuario en la BD para devolverlos a React
        const [userRows] = await db.query('SELECT nickname, avatar_img FROM Users WHERE id = ?', [user_id]);

        res.status(201).json({ 
            message: "¡Reseña publicada con éxito!",
            insertId: result.insertId,
            nickname: userRows[0].nickname,     
            avatar_img: userRows[0].avatar_img  
    
        });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            res.status(400).json({ error: "Ya has escrito una reseña para este elemento. Pasa al modo edición." });
        } else {
            res.status(500).json({ error: err.message });
        }
    }
});


// Editar reseña
router.put('/game/:id', async (req, res) => {
    const { title, content, rating } = req.body;
    const reviewId = req.params.id;

    if (rating < 0 || rating > 100) {
        return res.status(400).json({ error: "La nota debe estar entre 0 y 100" });
    }

    try {
        // Actualizamos y marcamos la fecha de edición con NOW()
        const sql = `
            UPDATE Game_Reviews 
            SET title = ?, content = ?, rating = ?, update_date = NOW() 
            WHERE id = ?`;
            
        const [result] = await db.query(sql, [title, content, rating, reviewId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "La reseña no existe" });
        }

        res.json({ message: "¡Reseña actualizada correctamente!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/manga/:id', async (req, res) => {
    const { title, content, rating } = req.body;
    const reviewId = req.params.id;

    if (rating < 0 || rating > 100) {
        return res.status(400).json({ error: "La nota debe estar entre 0 y 100" });
    }

    try {
        const sql = `
            UPDATE Manga_Reviews 
            SET title = ?, content = ?, rating = ?, update_date = NOW() 
            WHERE id = ?`;
            
        const [result] = await db.query(sql, [title, content, rating, reviewId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "La reseña no existe" });
        }

        res.json({ message: "¡Reseña actualizada correctamente!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// Borrar reseña
router.delete('/game/:id', async (req, res) => {
    try {
        const [result] = await db.query('DELETE FROM Game_Reviews WHERE id = ?', [req.params.id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "La reseña no existe" });
        }

        res.json({ message: "Reseña eliminada correctamente" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


router.delete('/manga/:id', async (req, res) => {
    try {
        const [result] = await db.query('DELETE FROM Manga_Reviews WHERE id = ?', [req.params.id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "La reseña no existe" });
        }

        res.json({ message: "Reseña eliminada correctamente" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;