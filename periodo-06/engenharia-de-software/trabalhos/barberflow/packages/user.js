import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // Em um app real, a senha DEVE ser criptografada (ex: bcrypt)
    appointments: [{ day: String, time: String }]
});

export const User = mongoose.model('User', UserSchema);