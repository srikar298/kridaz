# User Profile & Sports Preferences

The **User Profile** page is the personal sports identity hub for athletes on the Kridaz platform. It showcases active sports categories, player levels (e.g., beginner, intermediate, advanced), career-level statistical graphs, badges earned, and lists of connected teammates or players.

![User Profile Mockup](/img/platform/user_profile_mockup.png)

## Functional Definition

1. **Player Stats Dashboard:** Consolidates match appearances, win rates, MVPs, and sport-specific performance charts (e.g., runs scored/wickets taken for cricket, goals/assists for football).
2. **Sports Preferences & Levels:** Users highlight their preferred sports and set self-assessed skill levels.
3. **Interests Wizard:** Allows users to select specific sports, times of availability, and preferred roles (e.g., striker, defender, opening batsman) to optimize match recommendation engines.
4. **Social & Teaming:** Shows the user's network connections (followers/following) and current team memberships.

---

## Key Components & Implementation

The profile systems are implemented through the following components:

### 1. `Profile.jsx`

- **Path:** [Profile.jsx](file:///Users/prem/kridaz/client/user/src/features/profile/pages/Profile.jsx)
- **Functionality:** The main layout page that queries the user's data from `/api/users/profile/:id`, handles stats aggregation, and lists upcoming matches.
- **Key Code Snippet:**
  ```javascript
  // Fetch profile details and sports stats
  useEffect(() => {
    const loadProfileData = async () => {
      try {
        setLoading(true);
        const [profileRes, statsRes] = await Promise.all([
          axiosInstance.get(`/api/users/profile/${profileId}`),
          axiosInstance.get(`/api/users/profile/${profileId}/stats`),
        ]);
        setProfile(profileRes.data.profile);
        setStats(statsRes.data.stats);
      } catch (err) {
        toast.error("Failed to load profile details");
      } finally {
        setLoading(false);
      }
    };
    loadProfileData();
  }, [profileId]);
  ```

### 2. `EditProfileModal.jsx`

- **Path:** [EditProfileModal.jsx](file:///Users/prem/kridaz/client/user/src/shared/components/modals/EditProfileModal.jsx)
- **Functionality:** Handles modifications to generic info: display name, avatar uploads, banner image updates, and contact settings.

### 3. `InterestsModal.jsx`

- **Path:** [InterestsModal.jsx](file:///Users/prem/kridaz/client/user/src/shared/components/modals/InterestsModal.jsx)
- **Functionality:** An interactive sports picker that updates user interests in the DB. Toggling a sport updates the recommendation weight matrices used for suggesting nearby games.

### 4. `NetworkModal.jsx`

- **Path:** [NetworkModal.jsx](file:///Users/prem/kridaz/client/user/src/shared/components/modals/NetworkModal.jsx)
- **Functionality:** Displays lists of followers and following with options to instantly unfollow, chat, or invite them to join an active team roster.

---

## Styling & Design Integration

- **Card layout:** High contrast glassmorphic cards (`#161616` background with transparent styling, matching the dark theme) are used to group different panels (e.g. Activity, Stats, Trophy Cabinet).
- **Glow Borders:** Main stats cards use a subtle neon border glow (`box-shadow: 0 0 10px rgba(85, 222, 232, 0.15)`).
- **Badges:** Dynamic skill levels are highlighted with neon badges:
  - **Cyan Badge (`#55DEE8`):** Beginner / Amateur level.
  - **Blue Badge (`#3B82F6`):** Intermediate level.
  - **Lime Green Badge (`#BFF367`):** Advanced / Pro level.
