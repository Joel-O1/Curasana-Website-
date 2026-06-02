const prisma = require("../db");

const getHealthEvents = async (req, res) => {
    try {
        const healthEvents = await prisma.health_event.findMany({
            where: { 
                patient_profiles: {
                    user_id: req.user.userId
                }
            }
        });
        res.status(200).json(healthEvents);

    } catch (error){
        console.error(error);
        res.status(500).json({error: 'Failed to fetch health events'});
    }
}

module.exports = getHealthEvents;