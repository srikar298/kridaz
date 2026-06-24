import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

async function run() {
  try {
    await client.connect();
    console.log('Connected to PG');
    
    await client.query('DELETE FROM "GameDispute"');
    console.log('Deleted GameDispute');
    
    await client.query('DELETE FROM "GameTeam"');
    console.log('Deleted GameTeam');
    
    await client.query('DELETE FROM "GameSlot"');
    console.log('Deleted GameSlot');
    
    await client.query('DELETE FROM "HostedGame"');
    console.log('Deleted HostedGame');
    
    console.log('Successfully deleted all records');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

run();
