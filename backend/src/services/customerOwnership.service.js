const prisma = require('../config/prisma');

/**
 * Service to fetch all customers mapped to a portal user.
 * @param {string} userId - The internal user ID.
 * @returns {Promise<Array<string>>} Array of customer IDs.
 */
const getUserCustomers = async (userId) => {
  const mappings = await prisma.customerUser.findMany({
    where: { userId },
    select: { customerId: true },
  });
  return mappings.map((m) => m.customerId);
};

module.exports = { getUserCustomers };
