const jwt = require('jsonwebtoken');
const prisma = require('../db');

async function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const payload = jwt.verify(header.slice(7), process.env.JWT_SECRET);
    const user = await prisma.users.findUnique({
      where: { id: payload.userId },
      include: { patient_profiles: true },
    });

    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    req.user = user;
    req.patientId = user.patient_profiles?.id ?? null;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

function requirePatient(req, res, next) {
  if (!req.patientId) {
    return res.status(403).json({ message: 'Patient profile required' });
  }
  next();
}

module.exports = { requireAuth, requirePatient };
