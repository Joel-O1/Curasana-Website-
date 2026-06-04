const prisma = require('../db');

const getProfile = async (req, res) => {
  try {
    const profile = req.user.patient_profiles;
    if (!profile) return res.status(404).json({ message: 'Profile not found' });

    res.json({
      id: profile.id,
      firstName: profile.first_name,
      lastName: profile.last_name,
      email: req.user.email,
      username: req.user.username,
      dateOfBirth: profile.date_of_birth,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, dateOfBirth } = req.body;
    const updated = await prisma.patient_profiles.update({
      where: { id: req.patientId },
      data: {
        first_name: firstName,
        last_name: lastName,
        date_of_birth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      },
    });
    res.json({
      firstName: updated.first_name,
      lastName: updated.last_name,
      dateOfBirth: updated.date_of_birth,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { getProfile, updateProfile };
