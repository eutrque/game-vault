const express = require('express');
const router = express.Router();
const db = require('../db');

// Obtener todos los desarrolladores para el desplegable del formulario
router.get('/', async (req, res) => {
    try {
        // Seleccionamos id y nombre, y los ordenamos alfabéticamente
        const [rows] = await db.query('SELECT id, name FROM Developers ORDER BY name ASC');
        res.json(rows);
    } catch (err) {
        console.error("Error al obtener desarrolladores:", err);
        res.status(500).json({ error: "Error al cargar los desarrolladores" });
    }
});

module.exports = router;