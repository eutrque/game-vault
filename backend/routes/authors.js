const express = require('express');
const router = express.Router();
const db = require('../db');

// Listado de todos los autores 
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM Authors ORDER BY name ASC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Datos de un autor específico 
router.get('/:id', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM Authors WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ message: "Autor no encontrado" });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;