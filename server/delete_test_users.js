import { prisma } from './config/prisma.js';

async function main() {
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { name: { contains: 'test', mode: 'insensitive' } },
        { name: { contains: 'dummy', mode: 'insensitive' } },
        { email: { contains: 'test', mode: 'insensitive' } },
        { email: { contains: 'example', mode: 'insensitive' } },
        { email: { contains: 'yopmail', mode: 'insensitive' } },
        { phone: { contains: '123456' } },
        { phone: { contains: '000000' } },
        { phone: { contains: '999999' } }
      ]
    },
    select: { id: true }
  });
  
  if (users.length === 0) {
    console.log("No test users found.");
    return;
  }
  
  const userIds = users.map(u => u.id);
  console.log(`Preparing to delete ${userIds.length} test users...`);

  const fkQuery = `
    SELECT
      tc.table_name, 
      kcu.column_name
    FROM 
      information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY' AND ccu.table_name = 'User';
  `;

  const relations = await prisma.$queryRawUnsafe(fkQuery);
  const userIdsFormatted = userIds.map(id => `'${id}'`).join(',');
  
  // Manual cleanups for deep hierarchies not referencing User directly
  try {
    const tsQuery = `DELETE FROM "TrustScoreEvent" WHERE "professionalId" IN (SELECT id FROM "OwnerProfile" WHERE "userId" IN (${userIdsFormatted}));`;
    const res = await prisma.$executeRawUnsafe(tsQuery);
    console.log(`Deleted ${res} TrustScoreEvent records.`);
    
    const wrQuery = `DELETE FROM "WithdrawalRequest" WHERE "ownerId" IN (SELECT id FROM "OwnerProfile" WHERE "userId" IN (${userIdsFormatted}));`;
    const resWr = await prisma.$executeRawUnsafe(wrQuery);
    console.log(`Deleted ${resWr} WithdrawalRequest records.`);
    
    const turfQuery = `DELETE FROM "Turf" WHERE "ownerId" IN (SELECT id FROM "OwnerProfile" WHERE "userId" IN (${userIdsFormatted}));`;
    const resTurf = await prisma.$executeRawUnsafe(turfQuery);
    console.log(`Deleted ${resTurf} Turf records.`);
    
  } catch (err) {
    console.log("TrustScoreEvent cleanup error:", err.message.split('\\n')[0]);
  }
  
  // Second level: OwnerProfile -> ProfessionalService, Session, Portfolio, etc.
  // There could be more, let's catch any errors and print them.
  // We can just execute a bunch of dependent table deletes.
  
  for (let pass = 1; pass <= 3; pass++) {
    console.log(`\n--- Pass ${pass} ---`);
    for (const rel of relations) {
      try {
        const query = `DELETE FROM "${rel.table_name}" WHERE "${rel.column_name}" IN (${userIdsFormatted});`;
        const result = await prisma.$executeRawUnsafe(query);
        if (result > 0) {
          console.log(`Deleted ${result} records from ${rel.table_name}.${rel.column_name}`);
        }
      } catch (err) {
        // Silently ignore errors on early passes
        if (pass === 3) {
          console.log(`Failed to delete from ${rel.table_name}.${rel.column_name}: ${err.message.split('\\n')[0]}`);
        }
      }
    }
  }

  // Now try to delete the users
  try {
    const query = `DELETE FROM "User" WHERE id IN (${userIdsFormatted});`;
    const result = await prisma.$executeRawUnsafe(query);
    console.log(`\nSuccessfully deleted ${result} test users from User table.`);
  } catch (err) {
    console.error(`\nFailed to delete users:`, err.message);
  }
}

main().catch(console.error).finally(async () => {
  await prisma.$disconnect();
});
