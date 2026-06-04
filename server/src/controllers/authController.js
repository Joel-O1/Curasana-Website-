const prisma = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const register = async (req, res) => {
  try {
    const { email, username, password, firstName, lastName } = req.body;

    const existingUser = await prisma.users.findFirst({
      where: { OR: [{ email }, { username }] },
    });

    if (existingUser) {
      return res.status(400).json({ message: 'Email or username already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.users.create({
        data: {
          email,
          username,
          password_hash: passwordHash,
          role: 'patient',
        },
      });

      await tx.patient_profiles.create({
        data: {
          user_id: newUser.id,
          first_name: firstName || username,
          last_name: lastName || '',
        },
      });

      return newUser;
    });

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({ message: 'User created', token });
  } catch (error) {
    console.error(error);
    if (error.code === 'P1000') {
      return res.status(503).json({
        message: 'Database connection failed. Check DATABASE_URL password in .env (Supabase dashboard → Settings → Database).',
      });
    }
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.users.findFirst({
      where: { email },
      include: { patient_profiles: true },
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const passwordMatches = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatches) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        profile: user.patient_profiles,
      },
    });
  } catch (error) {
    console.error(error);
    if (error.code === 'P1000') {
      return res.status(503).json({
        message: 'Database connection failed. Check DATABASE_URL password in .env.',
      });
    }
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

const me = async (req, res) => {
  res.json({
    id: req.user.id,
    email: req.user.email,
    username: req.user.username,
    role: req.user.role,
    profile: req.user.patient_profiles,
  });
};

module.exports = { register, login, me };
