import express from 'express';

const app = express();
const PORT = 3000;

app.get('/', (req, res) => {
    res.send('FUE Controller Backend çalışıyor!');
});

app.listen(PORT, () => {
    console.log(`Backend sunucusu http://localhost:${PORT} adresinde başlatıldı.`);
});