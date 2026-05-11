const express = require('express');
const router = express.Router();
const db = require('../db'); 

// Obtener todas las plataformas 
router.get('/', async (req, res) => {
    try {
        // Seleccionamos ID y Nombre, ordenados alfabéticamente 
        const sql = 'SELECT id, name FROM Platforms ORDER BY name ASC';
        const [rows] = await db.query(sql);
        
        // Devolvemos el array de plataformas en formato JSON
        res.json(rows);
    } catch (err) {
        console.error("Error al obtener la lista de plataformas:", err);
        res.status(500).json({ error: "Error interno al cargar las plataformas" });
    }
});

module.exports = router;