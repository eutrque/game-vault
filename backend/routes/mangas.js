const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');
const path = require('path');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Configuración de Multer para las portadas de los mangas
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images/mangas/');
    },
    filename: (req, file, cb) => {
        const randomNumber = Math.round(Math.random() * 10000);
        const fileExtension = path.extname(file.originalname);
        const finalFileName = 'manga-' + Date.now() + '-' + randomNumber + fileExtension;
        cb(null, finalFileName);
    }
});
const upload = multer({ storage: storage });

// Listado general con filtros (Buscador normal)
router.get('/', async (req, res) => {
    
    const { search, genreid, publisherid, year, sort } = req.query;
    
    try {
        let sql = `
            SELECT m.*, 
            a.name AS author_name, 
            p.name AS publisher_name,
            p.image_url AS publisher_image
            FROM Mangas m
            JOIN Authors a ON m.author_id = a.id
            JOIN Publishers p ON m.publisher_id = p.id
            WHERE 1=1
        `;
        let params = [];

        if (search) {
            sql += ' AND m.title LIKE ?';
            params.push(`%${search}%`);
        }

        if (genreid && genreid !== 'Todos') {
            sql += ' AND m.id IN (SELECT manga_id FROM Manga_Genres WHERE genre_id = ?)';
            params.push(genreid);
        }

        // Filtrar por editorial si se selecciona una píldora
        if (publisherid && publisherid !== 'Todos') {
            sql += ' AND m.publisher_id = ?';
            params.push(publisherid);
        }

        if (year) {
            sql += ' AND m.release_year = ?';
            params.push(year);
        }

        // Ordenación por nota (score), fecha o título
        if (sort) {
            if (sort === 'score') sql += ' ORDER BY m.score DESC';
            else if (sort === 'date') sql += ' ORDER BY m.release_year DESC';
            else if (sort === 'title') sql += ' ORDER BY m.title ASC';
        } else {
            sql += ' ORDER BY m.id ASC'; 
        }

        const [rows] = await db.query(sql, params);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// Buscador con Inteligencia Artificial 
router.post('/ai-search', async (req, res) => {
    const { prompt } = req.body;
    // Valores por defecto por si la IA falla
    let aiFilters = { palabra_clave: null, genero: null, año: null };

    try {
        // Saneamiento de seguridad 
        if (!prompt) return res.status(400).json({ error: "Texto vacío" });
        const cleanQuery = prompt.replace(/(<([^>]+)>)/gi, "").trim().substring(0, 150);

        // El prompt 
        const iaInstruction = `
            Eres un experto bibliotecario de manga. Tu misión es traducir las peticiones del usuario a términos de búsqueda para una base de datos SQL.
            Usuario dice: "${cleanQuery}"

            Reglas estrictas de extracción:
            1. "genero": Si el usuario menciona categorías como Shonen, Seinen, Aventuras, Acción, Terror, Romance o Spokon, elije SOLO EL MÁS RELEVANTE. No devuelvas más de una palabra aquí. 
            2. "palabra_clave": Úsala para temas (ej: piratas), nombres de autores (ej: Oda), editoriales (ej: Shueisha, Kodansha) o personajes. No repitas aquí lo que ya pusiste en genero.
            3. Ignora frases subjetivas como "para leer rápido", "que tenga pendiente" o "que sea bueno".

            Responde ÚNICAMENTE el JSON puro:
            {
                "palabra_clave": string o null,
                "genero": string o null,
                "año": number o null
            }
            `;

        // Llamada a la API de Gemini usando el modelo activo
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" }); 
        const result = await model.generateContent(iaInstruction);
        const textResponse = result.response.text();

        // Parseo seguro del JSON (Quitamos los acentos invertidos si Gemini los devuelve)
        const cleanJsonString = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
        aiFilters = JSON.parse(cleanJsonString);

        // Si Gemini devuelve varios géneros separados por coma, nos quedamos solo con el primero
        if (aiFilters.genero && aiFilters.genero.includes(',')) {
            aiFilters.genero = aiFilters.genero.split(',')[0].trim();
        }

        console.log("Filtros detectados por Gemini 2.5:", aiFilters);

    } catch (err) {
        console.error("Fallo de comunicación con Gemini:", err.message);
    }

    // Consulta sql dinamica
    try {
        let sql = `
            SELECT m.*, 
            a.name AS author_name, 
            p.name AS publisher_name,
            p.image_url AS publisher_image
            FROM Mangas m
            JOIN Authors a ON m.author_id = a.id
            JOIN Publishers p ON m.publisher_id = p.id
            WHERE 1=1
        `;
        let params = [];

        // Si la IA detectó algo o si usamos los nulls por defecto
        if (aiFilters.palabra_clave) {
            sql += ' AND (m.title LIKE ? OR m.synopsis LIKE ? OR a.name LIKE ? OR p.name LIKE ?)';
            params.push(
                `%${aiFilters.palabra_clave}%`, 
                `%${aiFilters.palabra_clave}%`, 
                `%${aiFilters.palabra_clave}%`,
                `%${aiFilters.palabra_clave}%`
            );
        }

        if (aiFilters.genero) {

        const generoLimpio = aiFilters.genero.endsWith('s') ? aiFilters.genero.slice(0, -1) : aiFilters.genero;
    
        sql += ' AND m.id IN (SELECT mg.manga_id FROM Manga_Genres mg JOIN Genres g ON mg.genre_id = g.id WHERE g.name LIKE ?)';
        params.push(`%${generoLimpio}%`);
        }

        if (aiFilters.año) {
            sql += ' AND m.release_year = ?';
            params.push(aiFilters.año);
        }

        // Ejecutamos la consulta 
        const [rows] = await db.query(sql, params);

        // Devolvemos el array de resultados
        res.json({ message: "Búsqueda IA completada", results: rows });

    } catch (dbErr) {
        console.error("Error en DB:", dbErr);
        res.status(500).json({ error: "Error al procesar la búsqueda inteligente" });
    }
});

// Mangas populares 
router.get('/popular', async (req, res) => {
    try {
        const sql = `
            SELECT m.*, a.name AS author_name 
            FROM Mangas m 
            JOIN Authors a ON m.author_id = a.id
            ORDER BY m.score DESC LIMIT 6
        `;
        const [rows] = await db.query(sql);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Ver mangas de un autor específico
router.get('/author/:author_id', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM Mangas WHERE author_id = ?', [req.params.author_id]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Ver mangas de una editorial específica
router.get('/publisher/:pub_id', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM Mangas WHERE publisher_id = ?', [req.params.pub_id]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Ficha detalle del manga 
router.get('/:id', async (req, res) => {
    try {
        const mangaId = req.params.id;

        const sqlManga = `
            SELECT m.*, 
                   a.name as author_name, 
                   a.biography as author_bio, 
                   a.image_url as author_image, 
                   a.id as author_id, 
                   p.name as publisher_name,
                   p.image_url as publisher_image
            FROM Mangas m 
            JOIN Authors a ON m.author_id = a.id 
            JOIN Publishers p ON m.publisher_id = p.id
            WHERE m.id = ?`;
        const [mangas] = await db.query(sqlManga, [mangaId]);
        
        if (mangas.length === 0) {
            return res.status(404).json({ message: "Manga no encontrado" });
        }

        const manga = mangas[0];

        // Sacar géneros del manga
        const sqlGenres = `
            SELECT gen.name FROM Genres gen
            JOIN Manga_Genres mg ON gen.id = mg.genre_id
            WHERE mg.manga_id = ?`;
        const [genres] = await db.query(sqlGenres, [mangaId]);
        manga.genres = genres.map(g => g.name); 

        res.json(manga);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ADMIN - Añadir nuevo manga
router.post('/', upload.single('image'), async (req, res) => {
    const { title, synopsis, author_id, publisher_id, release_year, score, genres } = req.body;
    const imageName = req.file ? req.file.filename : null;

    try {
        const [result] = await db.query(
            'INSERT INTO Mangas (title, synopsis, author_id, publisher_id, cover_image, release_year, score) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [title, synopsis, author_id, publisher_id, imageName, release_year, score]
        );
        const newMangaId = result.insertId;

        if (genres) {
            const genresArray = JSON.parse(genres); 
            for (let genreId of genresArray) {
                await db.query('INSERT INTO Manga_Genres (manga_id, genre_id) VALUES (?, ?)', [newMangaId, genreId]);
            }
        }
        res.status(201).json({ message: "Manga creado correctamente", id: newMangaId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ADMIN - Borrar un manga
router.delete('/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM Manga_Genres WHERE manga_id = ?', [req.params.id]);
        await db.query('DELETE FROM Mangas WHERE id = ?', [req.params.id]);
        res.json({ message: "Manga eliminado" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;