const prisma = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const register = async (req, res) => {
    try {
        const { email, username, password } = req.body;
        const existingUser = await prisma.users.findFirst({
            where: { email: email}
        });

        if (existingUser){
            return res.status(400).json({ message: 'Email already exists'});
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const newUser = await prisma.users.create({
            data: {
                email,
                username, 
                password_hash: passwordHash,
                role: 'patient'
            }
        });

        res.status(201).json({message: 'User created'});
    } catch (error){
        console.error(error);
        res.status(500).json({error: 'Server error'});
    }
    
};

const login = async (req, res) => {
    try {
        const { email, username, password } = req.body;
        const user = await prisma.users.findFirst({ where: {email} });

        if (!user){
            return res.status(401).json({ message: 'User not found'});
        }

        const passwordMatches = await bcrypt.compare(password, user.password_hash);

        if (!passwordMatches){
            return res.status(401).json({message: 'Invalid username or password'});
        }

        const token = jwt.sign(
            { userId: user.id, role: user.role},
            process.env.JWT_SECRET,
            { expiresIn: '7d'}
        );
        res.status(200).json({ token });
    } catch (error){
        console.error(error);
        res.status(500).json({error: 'Server error'});
    }
};


module.exports = {register, login};