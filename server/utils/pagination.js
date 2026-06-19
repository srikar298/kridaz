/**
 * Pagination envelopes.
 *
 * Two flavors, picked per endpoint:
 *
 *  - Offset: stable lists with filters (turfs, bookings). Cheap totalCount.
 *  - Cursor: timestamp-ordered, mutating streams (chat, notifications, reels,
 *    story). New rows inserted at the head don't shift the cursor.
 *
 * Both return a `pagination` object the client can branch on. The mobile
 * InfiniteScroll widgets need at minimum { hasMore, nextCursor }.
 */

/**
 * @param {{ items: any[], page?: number, limit?: number, totalItems?: number }} args
 */
export const buildOffsetPage = ({
  items,
  page = 1,
  limit = 20,
  totalItems = 0,
}) => {
  const safeLimit = Math.max(1, Number(limit) || 1);
  const totalPages = Math.max(1, Math.ceil(totalItems / safeLimit));
  return {
    page: Number(page) || 1,
    limit: safeLimit,
    totalItems,
    totalPages,
    hasMore: (Number(page) || 1) < totalPages,
    nextCursor: null,
  };
};

/**
 * @param {{ items: any[], nextCursor: string|null, limit?: number, hasMore?: boolean }} args
 */
export const buildCursorPage = ({
  items,
  nextCursor,
  limit = 20,
  hasMore = !!nextCursor,
}) => ({
  page: null,
  limit: Number(limit) || items.length || 0,
  totalItems: null,
  totalPages: null,
  hasMore,
  nextCursor,
});

/**
 * Encode an opaque pagination cursor.
 *
 * URL-safe base64 of JSON. Clients should treat it as opaque — schema may
 * change. The encoding step deliberately uses no signing — cursors aren't
 * security-sensitive (an attacker forging a cursor only gets to skip rows
 * they could already see).
 */
export const encodeCursor = (obj) => {
  if (obj == null) return null;
  const json = JSON.stringify(obj);
  return Buffer.from(json, "utf8").toString("base64url");
};

/**
 * Decode a cursor produced by encodeCursor. Returns null on missing /
 * malformed input — callers should treat that as "start from the beginning".
 */
export const decodeCursor = (cursor) => {
  if (!cursor || typeof cursor !== "string") return null;
  try {
    const json = Buffer.from(cursor, "base64url").toString("utf8");
    return JSON.parse(json);
  } catch {
    return null;
  }
};
