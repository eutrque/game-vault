const express = require('express');
const router = express.Router();
const db = require('../db');

// Listado de todas las editoriales
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM Publishers ORDER BY name ASC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Detalle de una editorial específica
router.get('/:id', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM Publishers WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ message: "Editorial no encontrada" });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;