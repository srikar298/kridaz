import fs from 'fs';

const data = JSON.parse(fs.readFileSync('test_data_dump.json', 'utf8'));

let md = `# Test Data Deletion Review

The following records matched the word "test" (case-insensitive) in their name, username, or email. Please review the lists below.

## 🏢 Test Venues / Turfs (${data.turfs.length})

| Name | City | ID |
|---|---|---|
${data.turfs.map(t => `| ${t.name} | ${t.city} | \`${t.id}\` |`).join('\n')}

## 👤 Test Users (${data.users.length})

| Name | Email | Username | Role | ID |
|---|---|---|---|---|
${data.users.map(u => `| ${u.name} | ${u.email} | ${u.username} | ${u.role} | \`${u.id}\` |`).join('\n')}

---

**Do you want to delete ALL of these?** If there are any real users or venues in this list, please let me know which ones to **keep**, or confirm that I can delete everything listed above.
`;

fs.writeFileSync('test_data_review.md', md);
