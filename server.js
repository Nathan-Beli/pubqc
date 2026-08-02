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

// Middleware pour enregistrer les visites de base
app.use((req, res, next) => {
    if (req.path.startsWith('/api/') && req.path !== '/api/admin/logs' && req.path !== '/api/report-location') {
        const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        
        // Éviter les doublons immédiats pour la même IP
        const existing = accessLogs.find(l => l.ip === clientIp);
        if (!existing) {
            accessLogs.unshift({
                ip: clientIp,
                username: "Visiteur (Anonyme)",
                latitude: "Non partagée",
                longitude: "Non partagée",
                time: new Date().toLocaleString('fr-FR', { timeZone: 'America/Montreal' })
            });
            if (accessLogs.length > 50) accessLogs.pop();
        }
    }
    next();
});

// Route pour enregistrer la position précise et le pseudo du visiteur
app.post('/api/report-location', (req, res) => {
    const { username, latitude, longitude } = req.body;
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    // Chercher si cette IP existe déjà dans les logs pour mettre à jour ses infos
    let existingLog = accessLogs.find(l => l.ip === clientIp);
    
    if (existingLog) {
        existingLog.username = username || existingLog.username;
        existingLog.latitude = latitude || existingLog.latitude;
        existingLog.longitude = longitude || existingLog.longitude;
        existingLog.time = new Date().toLocaleString('fr-FR', { timeZone: 'America/Montreal' });
    } else {
        accessLogs.unshift({
            ip: clientIp,
            username: username || "Visiteur",
            latitude: latitude || "Non partagée",
            longitude: longitude || "Non partagée",
            time: new Date().toLocaleString('fr-FR', { timeZone: 'America/Montreal' })
        });
        if (accessLogs.length > 50) accessLogs.pop();
    }

    res.json({ success: true });
});

// Route pour récupérer les logs administrateur
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

// Routes de statut fictives pour éviter les erreurs si ton bot n'est pas branché
app.get('/api/status', (req, res) => res.json({ online: true, uptime: "24h" }));
app.get('/api/guild', (req, res) => res.json({ memberCount: 5 }));

// Lancement du serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Serveur Pub Québec démarré sur le port ${PORT}`);
});
