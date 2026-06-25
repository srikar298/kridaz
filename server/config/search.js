import { Meilisearch } from 'meilisearch';
import dotenv from 'dotenv';
dotenv.config();

// Default to localhost if environment variables aren't set yet
const host = process.env.MEILISEARCH_HOST || 'http://127.0.0.1:7700';
const apiKey = process.env.MEILISEARCH_API_KEY || 'masterKey';

export const meiliClient = new Meilisearch({
  host,
  apiKey,
});

/**
 * Helper to ensure the Turfs index exists with the right settings
 */
export const setupMeilisearch = async () => {
  try {
    const index = meiliClient.index('turfs');
    
    // Set searchable attributes (fields we'll actually search against)
    await index.updateSearchableAttributes([
      'name',
      'city',
      'state',
      'location'
    ]);

    // Set filterable attributes (fields we might filter by exactly)
    await index.updateFilterableAttributes([
      'id',
      'city',
      'state',
      'isActive'
    ]);

    // Set sortable attributes
    await index.updateSortableAttributes([
      'pricePerHour',
      'createdAt'
    ]);

    console.log('✅ Meilisearch: Turfs index configured successfully');
  } catch (err) {
    console.error('❌ Meilisearch setup failed:', err.message);
  }
};
