const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();

app.use(express.json());
app.use(cors());

// Servir le fichier index.html à la racine
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Stockage temporaire des logs de connexions / visites (en mémoire)
let accessLogs = [];
const ADMIN_PASSWORD = "nathan904"; // Ton mot de passe administrateur

// Middleware pour enregistrer les visites (ou tu peux l'appeler via une route spécifique /api/track)
app.use((req, res, next) => {
    // Si tu veux logger uniquement certaines routes ou toutes :
    if (req.path.startsWith('/api/') && req.path !== '/api/admin/logs') {
        const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        accessLogs.unshift({
            ip: clientIp,
            time: new Date().toLocaleString('fr-FR', { timeZone: 'America/Montreal' })
        });
        // Garder uniquement les 50 derniers logs
        if (accessLogs.length > 50) accessLogs.pop();
    }
    next();
});

// Route de tracking optionnelle si appelée explicitement par le front
app.post('/api/track', (req, res) => {
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    accessLogs.unshift({
        ip: clientIp,
        time: new Date().toLocaleString('fr-FR', { timeZone: 'America/Montreal' })
    });
    res.json({ success: true });
});

// Route pour récupérer les logs administrateur (Corrigée pour correspondre à /api/admin/logs)
app.get('/api/admin/logs', (req, res) => {
    const password = req.query.pass;

    if (password === ADMIN_PASSWORD) {
        return res.json({
            success: true,
            logs: accessLogs
        });
    } else {
        return res.status(401).json({
            success: false,
            message: "Mot de passe incorrect"
        });
    }
});

// Lancement du serveur (Render utilise process.env.PORT)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Serveur Pub Québec démarré sur le port ${PORT}`);
});
