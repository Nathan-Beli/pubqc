const express = require('express');
const cors = require('cors');
const app = express();

// TRÈS IMPORTANT sur Render : permet de récupérer la vraie IP à travers les proxys
app.set('trust proxy', true);

// Autoriser les requêtes venant de ton GitHub Pages
app.use(cors());
app.use(express.json());

// Tableau temporaire pour stocker les connexions de tous les visiteurs
let visitorLogs = [];

// Route pour enregistrer automatiquement l'IP de n'importe quel visiteur
app.get('/api/track', (req, res) => {
    // Récupère la vraie IP du visiteur
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const visitTime = new Date().toLocaleString('fr-CA', { timeZone: 'America/Montreal' });

    // Nettoie l'IP si elle vient avec un préfixe IPv6
    const cleanIp = clientIp && clientIp.includes('::ffff:') ? clientIp.replace('::ffff:', '') : clientIp;

    // Évite d'ajouter 50 fois la même IP d'affilée si la personne rafraîchit la page
    if (visitorLogs.length === 0 || visitorLogs[0].ip !== cleanIp) {
        visitorLogs.unshift({ ip: cleanIp, time: visitTime });
    }
    
    // Garde uniquement les 50 derniers visiteurs en mémoire
    if (visitorLogs.length > 50) visitorLogs.pop();

    res.json({ success: true, recorded: cleanIp });
});

// Route sécurisée pour récupérer la liste des IP depuis le panneau admin
app.get('/api/admin/logs', (req, res) => {
    const password = req.query.pass;
    if (password === 'nathan904') {
        res.json({ success: true, logs: visitorLogs });
    } else {
        res.status(401).json({ success: false, error: "Mot de passe incorrect" });
    }
});

// ==========================================
// TES AUTRES ROUTES EXISTANTES (Status & Guild)
// ==========================================

// Route pour le statut du bot
app.get('/api/status', (req, res) => {
    // Ajuste selon comment tu gères ton bot (si tu as une variable globale d'uptime par exemple)
    res.json({ 
        online: true, 
        uptime: "En ligne" // Remplace par ta variable d'uptime si tu en as une
    });
});

// Route pour les infos de la guilde/serveur Discord
app.get('/api/guild', (req, res) => {
    res.json({ 
        memberCount: 5 // Remplace ou connecte à ton client Discord.js (ex: client.guilds.cache.get('ID').memberCount)
    });
});

// Port d'écoute pour Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});
