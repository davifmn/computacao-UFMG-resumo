import mongoose from 'mongoose';

const WorkerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    specialties: [{ type: String, required: true }], // Ex: ['Corte de Cabelo', 'Barba']
    schedule: { type: Object, required: true }       // Armazenará a matriz do Board
});

export const Worker = mongoose.model('Worker', WorkerSchema);