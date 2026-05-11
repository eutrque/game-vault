const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const db = require('../db');


// Registro de usuario

router.post('/register', async (req, res) => {
    const { username, nickname, email, password } = req.body;

    if (!username || !nickname || !email || !password) {
        return res.status(400).send("Todos los campos son obligatorios. No dejes nada vacío.");
    }

    const validNameRegex = /^[a-zA-Z0-9_ ]+$/;
    if (!validNameRegex.test(username) || !validNameRegex.test(nickname)) {
        return res.status(400).send("Error: El usuario y nickname no pueden contener símbolos especiales.");
    }

    // Check de seguridad, min 8 caracteres y un símbolo (_, *, o -)
    if (!/^(?=.*[_*-])(?=.{8,}).*$/.test(password)) {
        return res.status(400).send("La contraseña debe tener al menos 8 caracteres y contener un símbolo (_, *, o -).");
    }

    try {
        // Encripto la clave antes de insertarla en la BD
        const hash = await bcrypt.hash(password, 10);
        
        const [result] = await db.query(
            'INSERT INTO Users (username, nickname, email, password) VALUES (?, ?, ?, ?)', 
            [username, nickname, email, hash]
        );

        const token = jwt.sign({ id: result.insertId }, process.env.JWT_SECRET, { expiresIn: '5m' });
        const link = `http://localhost:5173/home?token=${token}`;

        const transporter = nodemailer.createTransport({
            service: 'gmail', 
            auth: {
                user: process.env.EMAIL_USER, 
                pass: process.env.EMAIL_PASS  
            }
        });

        const mailOptions = {
            from: '"GameVault" <' + process.env.EMAIL_USER + '>',
            to: email, 
            subject: 'Activa tu cuenta en GameVault',
            html: `
                <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
                    <h1 style="color: #2563eb;">¡Hola, ${username}! </h1>
                    <p>Has solicitado registrarte en tu biblioteca de juegos.</p>
                    <p>Haz clic en el botón de abajo para activar tu cuenta de forma segura:</p>
                    <a href="${link}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0;">
                        Activar cuenta en GameVault
                    </a>
                    <p style="color: #666; font-size: 12px;">Este enlace es válido durante 5 minutos.</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        
        res.send("¡Cuenta creada! Te hemos enviado un correo para activarla.");

    } catch (error) {
        res.status(500).send("Hubo un error al registrar el usuario. Es posible que el correo ya esté en uso.");
    }
});


// Login

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).send("Por favor, introduce tu correo y contraseña.");
    }
    
    try {
        const [users] = await db.query('SELECT * FROM Users WHERE email = ?', [email]);
        const user = users[0];

        if (!user || !user.state || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).send("Credenciales incorrectas o cuenta bloqueada");
        }

        const finalToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        
        // Enviamos los datos que el Navbar necesita 
        res.json({ 
            token: finalToken,
            user: {
                id: user.id,
                nickname: user.nickname,
                avatar_img: user.avatar_img,
                role: user.role
            }
        });

    } catch (error) {
        console.error("Error en el login:", error);
        res.status(500).send("Hubo un error interno. Inténtalo más tarde.");
    }
});

// Verificacion y sesion

router.get('/verify', async (req, res) => {
    try {
        const decoded = jwt.verify(req.query.token, process.env.JWT_SECRET);
        
        // Activamos la cuenta
        await db.query('UPDATE Users SET state = true WHERE id = ?', [decoded.id]);
        
        // Le damos el token de 7 días para que haga el auto-login
        const finalToken = jwt.sign({ id: decoded.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.json({ token: finalToken });
        
    } catch (e) {
        res.status(401).send("Enlace caducado o inválido");
    }
});

// Solicitar recuperación de contraseña

router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    
    if (!email) {
        return res.status(400).send("Por favor, introduce tu correo electrónico.");
    }
    
    try {
        const [users] = await db.query('SELECT * FROM Users WHERE email = ?', [email]);
        const user = users[0];

        
        if (!user) {
            return res.send("Si el correo existe, recibirás un enlace de recuperación.");
        }

        // Token de 15 min para el cambio de clave
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '15m' });
        const link = `http://localhost:5173/reset-password?token=${token}`;

        const transporter = nodemailer.createTransport({
            service: 'gmail', 
            auth: {
                user: process.env.EMAIL_USER, 
                pass: process.env.EMAIL_PASS  
            }
        });

        const mailOptions = {
            from: '"GameVault" <' + process.env.EMAIL_USER + '>',
            to: email, 
            subject: 'Recupera tu contraseña de GameVault',
            html: `
                <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
                    <h1 style="color: #2563eb;">Recuperación de contraseña</h1>
                    <p>Has solicitado restablecer tu contraseña en GameVault.</p>
                    <p>Haz clic en el botón de abajo para crear una nueva:</p>
                    <a href="${link}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0;">
                        Cambiar mi contraseña
                    </a>
                    <p style="color: #666; font-size: 12px;">Este enlace es válido durante 15 minutos. Si no has sido tú, ignora este correo.</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        res.send("Si el correo existe, recibirás un enlace de recuperación.");

    } catch (error) {
        console.error("Error en forgot-password:", error);
        res.status(500).send("Hubo un error interno. Inténtalo más tarde.");
    }
});

// Restablecer la contraseña en la BD

router.post('/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
        return res.status(400).send("Faltan datos para restablecer la contraseña.");
    }

    if (!/^(?=.*[_*-])(?=.{8,}).*$/.test(newPassword)) {
        return res.status(400).send("La contraseña debe tener al menos 8 caracteres y contener un símbolo (_, *, o -).");
    }

    try {
        // Valido que el token del correo no haya caducado
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Encripto la nueva clave
        const hash = await bcrypt.hash(newPassword, 10);
        
        // Actualizo el usuario en la base de datos
        await db.query('UPDATE Users SET password = ? WHERE id = ?', [hash, decoded.id]);
        
        res.send("¡Contraseña actualizada con éxito! Ya puedes iniciar sesión.");

    } catch (e) {
        res.status(401).send("El enlace ha caducado o no es válido.");
    }
});

module.exports = router;