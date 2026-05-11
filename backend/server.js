const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/images/avatars', express.static(path.join(__dirname, 'images/avatars')));
app.use('/images/games', express.static(path.join(__dirname, 'images/games')));
app.use('/images/mangas', express.static(path.join(__dirname, 'images/mangas')));
app.use('/images/authors', express.static(path.join(__dirname, 'images/authors')));
app.use('/images/publishers', express.static(path.join(__dirname, 'images/publishers')));

// Rutas
app.use('/api/auth', require('./routes/auth'));       
app.use('/api/games', require('./routes/games'));     
app.use('/api/users', require('./routes/users'));     
app.use('/api/reviews', require('./routes/reviews')); 
app.use('/api/genres', require('./routes/genres'));   
app.use('/api/library', require('./routes/library')); 
app.use('/api/shared', require('./routes/shared')); 

app.use('/api/developers', require('./routes/developers'));
app.use('/api/platforms', require('./routes/platforms'));
app.use('/api/mangas', require('./routes/mangas'));
app.use('/api/authors', require('./routes/authors'));
app.use('/api/publishers', require('./routes/publishers'));
app.use('/api/comments', require('./routes/comments'));

// Puerto
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor listo y corriendo en puerto ${PORT}`);
});