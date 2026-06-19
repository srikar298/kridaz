# User Recommendation Engine (Follow Engine)

This document provides the technical specification, algorithmic structure, database access patterns, and integration points for the **User Recommendation Engine** (Suggest Players to Follow) implemented in the Kridaz platform.

---

## 1. Overview & Business Logic

The User Recommendation Engine is designed to increase user-to-user interaction and community density by suggesting relevant players for a user to follow. This widget is displayed in the sidebar on other users' profile pages (`/profile/:id`).

To protect user privacy and comply with formatting rules:

- **Privacy First**: The suggested player cards completely hide the user's real name and email address. Only the user's handle (prefixed with `@`) is displayed.
- **Audience Scope**: The suggestions are only shown when a user is viewing another player's profile (`!isOwnProfile`).

---

## 2. Recommendation Algorithm & Weights

The engine ranks candidate users based on a multi-factor scoring formula (total weight sum = `1.0`):

| Factor                                  | Weight | Parameter / Math                    | Description                                                                                             |
| :-------------------------------------- | :----- | :---------------------------------- | :------------------------------------------------------------------------------------------------------ |
| **F1: Mutual Followers (Social Graph)** | `35%`  | `min(mutuals * 0.2, 1.0)`           | Overlap in follow connections (2nd-degree network). 5+ mutuals gives a perfect 1.0.                     |
| **F2: Sport Affinity**                  | `25%`  | `1.0` (match) or `0.3` (no match)   | Overlap between candidate's sports and user's preferred sports.                                         |
| **F3: Geo Proximity**                   | `25%`  | `exp(-0.05 * distance_km)`          | Haversine distance with exponential decay. Decay parameter is set to `0.05` (broader range than turfs). |
| **F4: Popularity / Influence**          | `15%`  | `min(followers_count / 100.0, 1.0)` | normalized follower count to boost highly active community members.                                     |

---

## 3. Database Retrieval (SQL Queries)

To ensure optimal database performance, candidate fetching is restricted to the top 200 active users sorted by popularity, excluding users who are already followed by the requesting user.

### 2nd Degree Connection (Mutual Followers) Query:

This query traverses the social graph to count mutual follow connections:

```sql
SELECT r2."targetId", COUNT(r1."targetId") as mutual_count
FROM "UserRelationship" r1
JOIN "UserRelationship" r2 ON r1."targetId" = r2."userId"
WHERE r1."userId" = $1 AND r1.type = 'FOLLOW' AND r2.type = 'FOLLOW'
  AND r2."targetId" != $1
GROUP BY r2."targetId"
```

### Candidate Selection Query:

```sql
SELECT u.id, u.name, u.username, u."profilePicture", u."sportTypes", u.latitude, u.longitude,
       (SELECT COUNT(*) FROM "UserRelationship" WHERE "targetId" = u.id AND type = 'FOLLOW') as followers_count
FROM "User" u
WHERE u.id != $1 AND u.status = 'active'
ORDER BY followers_count DESC
LIMIT 200
```

---

## 4. Python Implementation (`user_recommendation_engine.py`)

The logic is written in asynchronous Python using `asyncpg` for high performance:

```python
async def get_user_recommendations(
    pool: asyncpg.Pool,
    user_id: str,
    user_lat: Optional[float] = None,
    user_lng: Optional[float] = None,
    limit: int = 20,
    include_scores: bool = False
) -> List[Dict[str, Any]]:
    # 1. Fetch user's profile and followed list
    # 2. Query 2nd-degree mutual follow relationships
    # 3. Pull top 200 candidate users
    # 4. Calculate weighted scoring for each candidate
    # 5. Sort candidates descending by totalScore and slice to limit
```

---

## 5. Express API Gateways

The Node.js Express server routes the client requests to the Python microservice:

- **Endpoint**: `GET /api/user/players/recommendations`
- **Controller File**: `server/modules/player/player.controller.js`
- **Method**: `getPlayerRecommendations` -> proxies requests to the Python FastAPI microservice at `http://localhost:8001/api/recommendations/players` with standard location queries and fallback logic.

---

## 6. Frontend Presentation (`Profile.jsx`)

The suggested players list is integrated into the user profile page.

### Layout Placement:

- Shown in the right sidebar when `!isOwnProfile` (viewing someone else's profile).
- Utilizes the custom hook `useUserRecommendations` to fetch player recommendations from the backend.

### React Component Implementation:

```jsx
{
  /* Suggested Players Sidebar Widget */
}
{
  !isOwnProfile && recommendations && recommendations.length > 0 && (
    <div className="bg-[#1A1D21]/80 backdrop-blur-xl border border-white/5 rounded-3xl p-6 shadow-2xl">
      <div className="flex items-center gap-2 mb-6">
        <Users className="text-[#55DEE8]" size={20} />
        <h3
          className="text-lg font-black text-white uppercase tracking-wider"
          style={HEADING_STYLE}
        >
          Suggested Players
        </h3>
      </div>
      <div className="flex flex-col gap-4">
        {recommendations.map((player) => (
          <div
            key={player.id}
            className="flex items-center justify-between gap-4 p-3 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all"
          >
            <div className="flex items-center gap-3">
              <img
                src={player.profilePicture || "/default-avatar.png"}
                className="w-10 h-10 rounded-full object-cover border border-white/10"
              />
              <div>
                {/* Only show handle, no email or real name */}
                <p className="text-sm font-bold text-white">
                  @{player.username}
                </p>
                {player.sportTypes && player.sportTypes.length > 0 && (
                  <span className="text-[10px] font-semibold text-[#55DEE8] bg-[#55DEE8]/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    {player.sportTypes[0]}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => handleFollowPlayer(player.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#55DEE8] to-[#BFF367] text-[#0D0F12] text-xs font-bold hover:opacity-90 transition-opacity"
            >
              <UserPlus size={14} />
              <span>Follow</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
```
