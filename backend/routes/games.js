const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');
const path = require('path');

// Configuración de Multer para guardar las portadas de los juegos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images/games/'); // Carpeta donde se guardan las fotos de los juegos
    },
    filename: (req, file, cb) => {
        // Nombre cifrado para evitar sobreescribir archivos con el mismo nombre
        const randomNumber = Math.round(Math.random() * 10000);
        const fileExtension = path.extname(file.originalname);
        const finalFileName = 'game-' + Date.now() + '-' + randomNumber + fileExtension;
        cb(null, finalFileName);
    }
});
const upload = multer({ storage: storage });

router.get('/', async (req, res) => {
    const { search, genreid, minRating, maxRating, year, sort } = req.query;
    
    try {
        let sql = `
            SELECT *, 
            (SELECT name FROM Developers WHERE Developers.id = Games.developer_id) AS developer_name
            FROM Games WHERE 1=1
        `;
        let params = [];

        if (search) {
            sql += ' AND title LIKE ?';
            params.push(`%${search}%`);
        }

        // Filtro por Género
        if (genreid && genreid !== 'Todos') {
            sql += ' AND id IN (SELECT game_id FROM Game_Genres WHERE genre_id = ?)';
            params.push(genreid);
        }

        // Rango de Calificación 
        if (minRating !== undefined && minRating !== '') {
            sql += ' AND average_rating >= ?';
            params.push(minRating);
        }

        if (maxRating !== undefined && maxRating !== '') {
            sql += ' AND average_rating <= ?';
            params.push(maxRating);
        }

        // Filtro por Año 
        if (year) {
            sql += ' AND YEAR(release_date) = ?';
            params.push(year);
        }

        // Sistema de ordenación
        if (sort) {
            if (sort === 'rating') sql += ' ORDER BY average_rating DESC';
            else if (sort === 'date') sql += ' ORDER BY release_date DESC';
            else if (sort === 'title') sql += ' ORDER BY title ASC';
        } else {
            sql += ' ORDER BY id ASC'; 
        }

        const [rows] = await db.query(sql, params);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// Juegos más populares
router.get('/popular', async (req, res) => {
    try {
        const sql = `
            SELECT *, 
            (SELECT name FROM Developers WHERE Developers.id = Games.developer_id) AS developer_name
            FROM Games 
            ORDER BY average_rating DESC LIMIT 6
        `;
        const [rows] = await db.query(sql);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Busqueda por desarrollador
router.get('/developer/:dev_id', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM Games WHERE developer_id = ?', [req.params.dev_id]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Ficha detalle de juego
router.get('/:id', async (req, res) => {
    try {
        const gameId = req.params.id;

        const sqlGame = `
            SELECT g.*, d.name as developer_name 
            FROM Games g 
            JOIN Developers d ON g.developer_id = d.id 
            WHERE g.id = ?`;
        const [games] = await db.query(sqlGame, [gameId]);
        
        if (games.length === 0) {
            return res.status(404).json({ message: "Juego no encontrado" });
        }

        const game = games[0];

        // Extraer generos
        const sqlGenres = `
            SELECT gen.name FROM Genres gen
            JOIN Game_Genres gg ON gen.id = gg.genre_id
            WHERE gg.game_id = ?`;
        const [genres] = await db.query(sqlGenres, [gameId]);
        game.genres = genres.map(g => g.name); 

        // Extraer las Plataformas 
        const sqlPlatforms = `
            SELECT p.name FROM Platforms p
            JOIN Game_Platforms gp ON p.id = gp.platform_id
            WHERE gp.game_id = ?`;
        const [platforms] = await db.query(sqlPlatforms, [gameId]);
        game.platforms = platforms.map(p => p.name);

        res.json(game);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// PANEL DE ADMIN 

// POST - Añadir nuevo juego
router.post('/', upload.single('image'), async (req, res) => {
    
    const { title, description, developer_id, release_date, genres, platforms, average_rating } = req.body;
    const imageName = req.file ? req.file.filename : null;

    try {
        const [result] = await db.query(
            'INSERT INTO Games (title, description, developer_id, image, release_date, average_rating) VALUES (?, ?, ?, ?, ?, ?)',
            [title, description, developer_id, imageName, release_date, average_rating]
        );
        const newGameId = result.insertId;

        if (genres) {
            const genresArray = JSON.parse(genres); 
            for (let genreId of genresArray) {
                await db.query('INSERT INTO Game_Genres (game_id, genre_id) VALUES (?, ?)', [newGameId, genreId]);
            }
        }

        if (platforms) {
            const platformsArray = JSON.parse(platforms); 
            for (let platId of platformsArray) {
                await db.query('INSERT INTO Game_Platforms (game_id, platform_id) VALUES (?, ?)', [newGameId, platId]);
            }
        }

        res.status(201).json({ message: "Juego creado correctamente", id: newGameId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT - Editar datos de un juego
router.put('/:id', upload.single('image'), async (req, res) => {
    const { title, description, release_date, developer_id, genres, platforms, average_rating } = req.body; 
    const gameId = req.params.id;
    
    try {
        let updateQuery = 'UPDATE Games SET title = ?, description = ?, release_date = ?, developer_id = ?, average_rating = ?';
        let updateParams = [title, description, release_date, developer_id, average_rating];

        if (req.file) {
            updateQuery += ', image = ?';
            updateParams.push(req.file.filename);
        }
        
        updateQuery += ' WHERE id = ?';
        updateParams.push(gameId);
        await db.query(updateQuery, updateParams);

        if (genres) {
            await db.query('DELETE FROM Game_Genres WHERE game_id = ?', [gameId]);
            const genresArray = JSON.parse(genres);
            for (let genreId of genresArray) {
                await db.query('INSERT INTO Game_Genres (game_id, genre_id) VALUES (?, ?)', [gameId, genreId]);
            }
        }

        if (platforms) {
            await db.query('DELETE FROM Game_Platforms WHERE game_id = ?', [gameId]);
            const platformsArray = JSON.parse(platforms);
            for (let platId of platformsArray) {
                await db.query('INSERT INTO Game_Platforms (game_id, platform_id) VALUES (?, ?)', [gameId, platId]);
            }
        }

        res.json({ message: "Juego actualizado correctamente" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE - Borrar un juego
router.delete('/:id', async (req, res) => {
    try {
        // IMPORTANTE: Primero borramos las relaciones en las tablas puente para evitar errores de Foreign Key
        await db.query('DELETE FROM Game_Genres WHERE game_id = ?', [req.params.id]);
        await db.query('DELETE FROM Game_Platforms WHERE game_id = ?', [req.params.id]);
        // Finalmente borramos el juego
        await db.query('DELETE FROM Games WHERE id = ?', [req.params.id]);
        
        res.json({ message: "Juego eliminado" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;