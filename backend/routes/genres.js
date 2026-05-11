const express = require('express');
const router = express.Router();
const db = require('../db');

// Obtener géneros filtrados según si es de juegos o mangas
router.get('/', async (req, res) => {
    // Obtenemos el parámetro 'type' que nos manda el Navbar (puede ser 'game' o 'manga')
    const { type } = req.query; 

    try {
        let sql = 'SELECT id, name FROM Genres';
        
        // Añadimos la condición where dependiendo de dónde esté el usuario
        if (type === 'game') {
            sql += " WHERE category IN ('game', 'both')";
        } else if (type === 'manga') {
            sql += " WHERE category IN ('manga', 'both')";
        }

        sql += ' ORDER BY name ASC';
        
        const [rows] = await db.query(sql);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;