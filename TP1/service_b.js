const express = require('express');
const app = express();

app.get('/api/data', (req, res) => {
    res.json({
        status: "success",
        message: "Bonjour depuis le Service B",
        source: "Service B"
    });
});

const port = process.env.PORT || 9090;
app.listen(port, '0.0.0.0', () => console.log(`Service B sur le port ${port}`));