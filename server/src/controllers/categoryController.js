const prisma = require('../db');

const list = async (_req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { category_name: 'asc' },
      select: {
        id: true,
        category_name: true,
        icon: true,
        color: true,
        description: true,
      },
    });
    res.json(categories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { list };
