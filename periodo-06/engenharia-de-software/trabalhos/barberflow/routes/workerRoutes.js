import express from 'express';
import { Worker } from '../packages/worker.js';

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const workers = await Worker.find({}, 'name specialties');
        res.json(workers);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar especialistas' });
    }
});

// NOVA ROTA: Calcular o General Board
router.post('/board', async (req, res) => {
    try {
        const { workerId, services } = req.body;
        
        let workersToConsider = [];

        if (workerId === 'any') {
            // Busca todos os workers. Depois filtramos os que têm TODAS as especialidades pedidas
            const allWorkers = await Worker.find({});
            workersToConsider = allWorkers.filter(w => 
                services.every(srv => w.specialties.includes(srv))
            );
        } else {
            // Busca apenas o worker específico
            const specificWorker = await Worker.findById(workerId);
            if (specificWorker) workersToConsider.push(specificWorker);
        }

        if (workersToConsider.length === 0) {
            return res.status(404).json({ error: 'Nenhum especialista disponível para esses serviços.' });
        }

        // Montar o General Board
        const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        const hours = ['07:00','08:00','09:00','10:00','11:00','13:00','14:00','15:00','16:00','17:00'];
        const generalSchedule = {};

        days.forEach(day => {
            generalSchedule[day] = {};
            hours.forEach(hour => {
                // Checa se PELO MENOS UM dos especialistas está livre neste dia/hora
                const isFree = workersToConsider.some(w => w.schedule[day][hour] === 'free');
                generalSchedule[day][hour] = isFree ? 'free' : 'occupied';
            });
        });

        res.json({ days, hours, schedule: generalSchedule });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao gerar o quadro de horários.' });
    }
});


// NOVA ROTA: Confirmar agendamento (ocupa os horários no banco)
router.post('/book', async (req, res) => {
    try {
        const { workerId, services, slots } = req.body;
        
        let workersToConsider = [];

        if (workerId === 'any') {
            const allWorkers = await Worker.find({});
            workersToConsider = allWorkers.filter(w => 
                services.every(srv => w.specialties.includes(srv))
            );
        } else {
            const specificWorker = await Worker.findById(workerId);
            if (specificWorker) workersToConsider.push(specificWorker);
        }

        // Tenta encontrar 1 especialista que esteja livre em TODOS os horários escolhidos
        let assignedWorker = null;
        for (let worker of workersToConsider) {
            let isFreeForAll = true;
            for (let slot of slots) {
                if (worker.schedule[slot.day][slot.time] !== 'free') {
                    isFreeForAll = false;
                    break;
                }
            }
            if (isFreeForAll) {
                assignedWorker = worker;
                break;
            }
        }

        if (!assignedWorker) {
            return res.status(400).json({ error: 'Desculpe, esses horários acabaram de ser ocupados. Tente novamente.' });
        }

        // Marcar os horários como ocupados no documento do especialista
        for (let slot of slots) {
            assignedWorker.schedule[slot.day][slot.time] = 'occupied';
        }

        // Obrigatório no Mongoose ao alterar objetos internos
        assignedWorker.markModified('schedule');
        await assignedWorker.save();

        res.json({ message: 'Agendamento salvo!', workerName: assignedWorker.name });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao registrar agendamento.' });
    }
});

export default router;