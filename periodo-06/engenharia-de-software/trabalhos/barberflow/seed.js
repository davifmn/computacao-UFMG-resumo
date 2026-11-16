import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Worker } from './packages/worker.js';
import { Board } from './packages/board.js';

dotenv.config();


const specialitiesList = ['Corte de Cabelo', 'Barba', 'Sobrancelha'];
const names = ['André', 'Bruno', 'Carlos', 'Daniel', 'Eduardo', 'Fábio', 'Gabriel', 'Henrique', 'Igor', 'João', 'Lucas', 'Marcos', 'Nicolas', 'Otávio', 'Pedro'];

async function seedDatabase() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Conectado ao MongoDB. Limpando trabalhadores antigos...');
        await Worker.deleteMany({}); // CUIDADO: Isso apaga todos os workers existentes

        const workersData = [];

        for (let i = 0; i < 15; i++) {
            // Sorteia especialidades aleatórias (de 1 a 3 especialidades por worker)
            const shuffled = specialitiesList.sort(() => 0.5 - Math.random());
            const specialties = shuffled.slice(0, Math.floor(Math.random() * 3) + 1);
            
            // Cria um novo quadro com a simulação de ocupados/livres
            const board = new Board();

            workersData.push({
                name: names[i],
                specialties: specialties,
                schedule: board.schedule
            });
        }

        await Worker.insertMany(workersData);
        console.log('15 Trabalhadores populados com sucesso no banco de dados!');
        process.exit(); // Encerra o script com sucesso

    } catch (error) {
        console.error('Erro ao popular o banco:', error);
        process.exit(1);
    }
}

seedDatabase();