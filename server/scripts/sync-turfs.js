import "dotenv/config";
import { prisma } from "../config/prisma.js";
import { meiliClient, setupMeilisearch } from "../config/search.js";

async function syncTurfs() {
  console.log("Starting Turf synchronization to Meilisearch...");

  try {
    // 1. Ensure index is set up
    await setupMeilisearch();

    // 2. Fetch all turfs from Postgres
    const turfs = await prisma.turf.findMany({
      select: {
        id: true,
        name: true,
        location: true,
        city: true,
        state: true,
        pricePerHour: true,
        isActive: true,
        createdAt: true,
        images: true
      }
    });

    console.log(`Fetched ${turfs.length} turfs from PostgreSQL.`);

    if (turfs.length === 0) {
      console.log("No turfs to synchronize.");
      return;
    }

    // 3. Format them for Meilisearch
    const formattedTurfs = turfs.map(turf => ({
      ...turf,
      // Meilisearch requires an 'id' field, which we already have.
      // Convert Date to timestamp for sorting if needed
      createdAtTimestamp: new Date(turf.createdAt).getTime(),
      images: turf.images || []
    }));

    // 4. Push to Meilisearch
    const index = meiliClient.index('turfs');
    const response = await index.addDocuments(formattedTurfs);

    console.log("Documents added to Meilisearch! Task ID:", response.taskUid);
    
    // Wait for the task to finish
    await meiliClient.waitForTask(response.taskUid);
    console.log("✅ Synchronization complete!");

  } catch (error) {
    console.error("❌ Synchronization failed:", error);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

syncTurfs();
