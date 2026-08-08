import * as argon2 from 'argon2';

import { env } from '../../src/configs/env.js';
import { prisma } from '../../src/infra/prisma.js';
import logger from '../../src/infra/logger.js';

async function seedAdmin() {
    const adminUsername = env.ADMIN_USERNAME;
    const adminPassword = env.ADMIN_PASSWORD;

    const admin = await prisma.user.findFirst({ where: { username: adminUsername } })
    if (admin) throw new Error("Admin already exists: Skipping seeding...");

    const hashedPassword = await argon2.hash(adminPassword)
    const adminCreated = await prisma.user.create({
        data: {
            name: "admin",
            username: adminUsername,
            hashedPassword,
            role: "ADMIN",
        }
    })
    logger.info({ admin: adminCreated.name, username: adminCreated.username }, "Admin created:")
    logger.info("Seeding admin completed successfully")
}

seedAdmin().then(async () => await prisma.$disconnect()).catch(async (err) => {
    logger.error(err, "Error seeding admin")
    await prisma.$disconnect()
    process.exit(1)
})