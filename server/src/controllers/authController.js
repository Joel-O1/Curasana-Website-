const prisma = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const register = async (req, res) => {
    try {
        const { email, username, password } = req.body;
        const existingEmail = await prisma.users.findFirst({
            where: { email: email}
        });

        const existingUsername = await prisma.users.findFirst({
            where: { username: username}
        });

        if (existingUsername){
            return res.status(400).json({ message: 'Username already exists'});
        }

        if (existingEmail){
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

        //console.log("Login attempt with email:", req.body.email); // Log the email being used for login --- DEBUGGING PURPOSES ONLY, REMOVE IN PRODUCTION ---
        const { email, username, password } = req.body;

        // const allUsers = await prisma.users.findMany();
        // console.log("ALL USERS IN DB:", JSON.stringify(allUsers, null, 2)); //To FIND ALL THE USERS IN THE DB FOR DEBUGGING PURPOSES

        const user = await prisma.users.findFirst({
            where:
                { email: {
                    equals: req.body.email,
                    mode: 'insensitive',
                } 
            }
        });

        if (!user){
            console.log("User not found with email:", email);
            return res.status(401).json({ message: 'User not found'});
        }

        const passwordMatches = await bcrypt.compare(password, user.password_hash);

        if (!passwordMatches){
            return res.status(401).json({message: 'Invalid email or password'});
        }

        const token = jwt.sign(
            { userId: user.id, role: user.role}, //this data is encoded into the token
            process.env.JWT_SECRET,
            { expiresIn: '7d'}
        );
        //console.log("User: ",user); // Log the user object being returned from the database --- DEBUGGING PURPOSES ONLY, REMOVE IN PRODUCTION ---
        res.status(200).json({"user signed in": true, token,  });
    } catch (error){
        console.error(error);
        res.status(500).json({error: 'Server error'});
    }
};


module.exports = {register, login};