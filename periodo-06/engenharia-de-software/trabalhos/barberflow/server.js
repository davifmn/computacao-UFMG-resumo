import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js'; 
import workerRoutes from './routes/workerRoutes.js'; 


dotenv.config();

const app = express();
app.use(cors()); // Permite que o frontend acesse o backend
app.use(express.json()); // Permite receber dados em JSON

app.use('/api/auth', authRoutes);
app.use('/api/workers', workerRoutes); 

// Conexão com o MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Conectado ao MongoDB Atlas!'))
    .catch((error) => console.error('Erro ao conectar ao MongoDB:', error));

// Rota de teste
app.get('/', (req, res) => {
    res.send('API do BarberFlow rodando!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta http://localhost:${PORT}`);
});