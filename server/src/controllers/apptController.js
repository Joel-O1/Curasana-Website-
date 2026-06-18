const prisma = require("../db");

const getAppointments = async (req, res) => {
    try {
        const appointments = await prisma.appointment.findMany({
            where: { 
                patient_profiles: {
                    user_id: req.user.userId
                }
            }
        });
        res.status(200).json(appointments);

    } catch (error){
        console.error(error);
        res.status(500).json({error: 'Failed to fetch appointments'});
    }
}

module.exports = getAppointments;