const express = require('express');
const app = express();

const SERVICE_B_URL = process.env.SERVICE_B_URL || 'http://service-b:9090/api/data';

app.get('/api/enrich', async (req, res) => {
    try {
        // Appel asynchrone au Service B
        // async/await est utilisé pour gérer la promesse de fetch c'est à dire que l'exécution attendra la réponse avant de continuer
        const response = await fetch(SERVICE_B_URL);
        const data_b = await response.json();
        
        // Enrichissement direct de l'objet c'est à dire que l'on ajoute des informations supplémentaires à la réponse du Service B
        res.json({
            meta: {
                processed_by: "Service A",
                timestamp: new Date().toISOString()
            },
            data_from_b: data_b,
            new_field: "Donnée ajoutée par le Service A"
        });
    } catch (error) {
        res.status(502).json({ error: "Impossible de joindre le Service B" });
    }
});

const port = process.env.PORT || 9090;
app.listen(port, '0.0.0.0', () => console.log(`Service A sur le port ${port}`));