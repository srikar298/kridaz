import pkg_prisma from '@prisma/client';
const { PrismaClient } = pkg_prisma;
import pkg_pg from 'pg';
const { Pool } = pkg_pg;
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';
import { encrypt, decrypt, isEncrypted } from '../utils/encryption.js';
import { queryContext } from '../middleware/queryCounter.middleware.js';

dotenv.config();

/**
 * Sensitive fields that should be encrypted/decrypted
 */
const SENSITIVE_FIELDS = ['youtubeAccessToken', 'youtubeRefreshToken', 'facebookAccessToken'];

/**
 * Helper to process socialAccounts JSON array
 */
const processSocialAccounts = (accounts, action) => {
  if (!Array.isArray(accounts)) return accounts;
  return accounts.map(acc => {
    const updated = { ...acc };
    if (updated.accessToken) {
      updated.accessToken = action === 'encrypt' ? encrypt(updated.accessToken) : decrypt(updated.accessToken);
    }
    if (updated.refreshToken) {
      updated.refreshToken = action === 'encrypt' ? encrypt(updated.refreshToken) : decrypt(updated.refreshToken);
    }
    return updated;
  });
};

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ 
  connectionString,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  allowExitOnIdle: true
});
const adapter = new PrismaPg(pool);
const basePrisma = new PrismaClient({ adapter });

const prisma = basePrisma.$extends({
  query: {
    $allModels: {
      async $allOperations({ args, query }) {
        if (queryContext) {
          const store = queryContext.getStore();
          if (store) {
            store.queryCount++;
          }
        }
        return query(args);
      },
    },
    user: {
      async $allOperations({ model, operation, args, query }) {
        // Encrypt sensitive fields on write operations
        const isWrite = ['create', 'update', 'upsert', 'updateMany'].includes(operation);
        if (isWrite) {
          const processData = (data) => {
            if (!data) return;
            SENSITIVE_FIELDS.forEach(field => {
              if (data[field] && typeof data[field] === 'string' && !isEncrypted(data[field])) {
                data[field] = encrypt(data[field]);
              }
            });
            if (data.socialAccounts) {
              data.socialAccounts = processSocialAccounts(data.socialAccounts, 'encrypt');
            }
          };

          if (operation === 'upsert') {
            processData(args.create);
            processData(args.update);
          } else if (args.data) {
            processData(args.data);
          }
        }
        return query(args);
      },
    },
  },
  result: {
    user: {
      youtubeAccessToken: {
        needs: { youtubeAccessToken: true },
        compute(user) { return decrypt(user.youtubeAccessToken); },
      },
      youtubeRefreshToken: {
        needs: { youtubeRefreshToken: true },
        compute(user) { return decrypt(user.youtubeRefreshToken); },
      },
      facebookAccessToken: {
        needs: { facebookAccessToken: true },
        compute(user) { return decrypt(user.facebookAccessToken); },
      },
      socialAccounts: {
        needs: { socialAccounts: true },
        compute(user) { return processSocialAccounts(user.socialAccounts, 'decrypt'); },
      },
    },
  },
});

export { prisma };
