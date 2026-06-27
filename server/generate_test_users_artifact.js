import { prisma } from './config/prisma.js';
import fs from 'fs';

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
    select: { id: true, name: true, email: true, phone: true, role: true }
  });
  
  let md = '# List of Test Users\n\n';
  md += 'Here are the ' + users.length + ' test users found in the database. Please review them before we proceed with deletion.\n\n';
  md += '| Name | Email | Phone | Role |\n';
  md += '|---|---|---|---|\n';
  users.forEach(u => {
    md += '| ' + u.name + ' | ' + u.email + ' | ' + (u.phone || 'N/A') + ' | ' + u.role + ' |\n';
  });
  
  fs.writeFileSync('C:/Users/saavi/.gemini/antigravity-ide/brain/afa027a4-7cad-49d2-9d32-4762d54de4d6/test_users_list.md', md);
  console.log('Artifact created with ' + users.length + ' users.');
}

main().catch(console.error).finally(async () => {
  await prisma.$disconnect();
});
