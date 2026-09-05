const prisma = require('./src/config/prisma');

async function showUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        loginId: true,
        name: true,
        email: true,
        role: { select: { name: true } },
        isActive: true,
        createdAt: true,
      },
    });

    console.log('\n================ USERS IN POSTGRES DATABASE ("User" table) ================');
    console.table(
      users.map((u) => ({
        ID: u.id,
        'Login ID': u.loginId,
        Name: u.name,
        Email: u.email,
        Role: u.role.name,
        Active: u.isActive,
      }))
    );
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

showUsers();
