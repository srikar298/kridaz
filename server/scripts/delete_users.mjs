import { prisma } from "../config/prisma.js";

async function main() {
  console.log("Fetching non-admin users...");
  const allUsers = await prisma.user.findMany({
    select: { id: true, email: true, role: true },
  });

  const usersToDelete = allUsers.filter(
    (u) => u.role !== "ADMIN" && u.role !== "BMSP_SUPER_ADMIN"
  );

  if (usersToDelete.length === 0) {
    console.log("No regular users found to delete.");
    return;
  }

  console.log(`Found ${usersToDelete.length} regular users to delete.`);
  const userIds = usersToDelete.map((u) => u.id);

  console.log("Deleting dependent records...");

  const keys = Object.keys(prisma);

  // We want to loop backwards or just repeat a few times to handle nested dependencies
  for (let iteration = 0; iteration < 3; iteration++) {
    for (const key of keys) {
      if (key === "user" || key.startsWith("$") || key.startsWith("_"))
        continue;

      const model = prisma[key];
      if (model && typeof model.deleteMany === "function") {
        const fieldsToTry = [
          "userId",
          "creatorId",
          "ownerId",
          "organizerId",
          "professionalId",
        ];

        for (const field of fieldsToTry) {
          try {
            await model.deleteMany({
              where: { [field]: { in: userIds } },
            });
          } catch (e) {
            // Ignore errors
          }
        }
      }
    }
  }

  console.log("Deleting users...");
  try {
    const result = await prisma.user.deleteMany({
      where: {
        id: { in: userIds },
      },
    });
    console.log(`Successfully deleted ${result.count} users.`);
  } catch (error) {
    console.error(
      "Failed to delete users. Foreign key constraint might be preventing this.",
      error.message
    );
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
