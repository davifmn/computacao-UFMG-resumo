import express from 'express';
import { User } from '../packages/user.js';

const router = express.Router();

// Rota de Cadastro (Sign Up)
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        // Verifica se o usuário já existe
        const userExists = await User.findOne({ email });
        if (userExists) return res.status(400).json({ error: 'E-mail já cadastrado!' });

        // Cria o novo usuário
        const newUser = new User({ name, email, password });
        await newUser.save();

        res.status(201).json({ message: 'Usuário cadastrado com sucesso!', user: newUser });
    } catch (error) {
        console.error('ERRO REAL DO BANCO:', error); // Isso vai imprimir o erro exato no terminal
        res.status(500).json({ error: 'Erro ao cadastrar usuário' });
    }
});

// Rota de Login (Sign In)
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Busca o usuário no banco
        const user = await User.findOne({ email, password });
        if (!user) return res.status(401).json({ error: 'E-mail ou senha inválidos!' });

        res.status(200).json({ message: 'Login realizado com sucesso!', user });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao fazer login' });
    }
});

export default router;