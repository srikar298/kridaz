const { Client } = require('pg');
const connectionString = "postgresql://kridaz:NFUWLED1SAgPtGK9rl5waA1!@kridaz364133.postgres.database.azure.com:5432/postgres?sslmode=require";

async function main() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    
    console.log("Fetching Turfs/Venues...");
    const turfs = await client.query('SELECT id, name, image, images FROM "Turf" LIMIT 3');
    console.log("Turfs:", JSON.stringify(turfs.rows, null, 2));

    console.log("\nFetching AdBanners...");
    const banners = await client.query('SELECT * FROM "AdBanner" LIMIT 3');
    console.log("Banners:", JSON.stringify(banners.rows, null, 2));

  } catch (err) {
    console.error("Error executing query", err.stack);
  } finally {
    await client.end();
  }
}
main();
