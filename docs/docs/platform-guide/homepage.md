# Homepage Guide

The **Homepage** is the primary entry point for users visiting the Kridaz platform. It serves as a discovery hub, showcasing the premium sports ecosystem, facilitating quick navigation, and displaying nearby players and community updates.

![Homepage Mockup](/img/platform/homepage_mockup.png)

## Overview & UI Structure

The page (`client/user/src/pages/Home.jsx`) is designed with a premium, high-impact aesthetic utilizing a dark theme with vibrant cyan-to-lime (`#55DEE8` to `#BFF367`) gradients and accents.

### Key Sections:

1. **Cinematic Hero Banner:**
   A full-viewport section with dynamic background imagery, bold typography, and a distinct call-to-action ("Book Now"). Includes subtle micro-animations and a display of key metrics (e.g., "1M+ Bookings Made").

2. **Quick Navigation (Hot Bars):**
   A horizontal scrollable bar offering fast access to core modules:
   - Live Score
   - Join Tournaments
   - Find Players
   - Marketplace

3. **Arena Discovery:**
   A unified filter and search section (powered by the `SearchTurf` component). Users can toggle between "Venues" and "Marketplace", select locations dynamically, and view a grid of high-fidelity turf cards.

4. **Player Network:**
   A dynamic horizontal list of nearby athletes and community members. It features compact profile cards with follow/unfollow functionality, distance calculations, and skill badges.

## Code Implementation

The homepage heavily utilizes React hooks for data fetching and state management.

### Data Fetching

The page aggregates data from multiple endpoints in parallel to minimize load times:

```javascript
useEffect(() => {
  const fetchData = async () => {
    try {
      const results = await Promise.allSettled([
        axiosInstance.get("/api/features"),
        axiosInstance.get("/api/features/marketing"),
        axiosInstance.get("/api/user/community"),
      ]);
      // State updates for feature flags, marketing banners, and social posts
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };
  fetchData();
}, []);
```

### Location Context

The page proactively attempts to detect the user's location (via browser Geolocation API or an IP fallback) to provide hyper-localized venue and player recommendations.

```javascript
const fallbackToIPLocation = async () => {
  try {
    const res = await fetch("https://ipapi.co/json/");
    const data = await res.json();
    setUserLocation({
      lat: data.latitude,
      lng: data.longitude,
      city: data.city,
      state: data.region,
    });
  } catch (error) {
    setLocationStatus("denied");
  }
};
```

### Component Architecture

- **`Home.jsx`:** The orchestrator component that holds the global state (location, filters) and lays out the sections.
- **`<TurfCard />`:** Renders individual venue data, including images, rating, distance, and quick booking actions.
- **`<SearchTurf />`:** A dedicated unified filter bar allowing users to search by sport, location, and apply advanced filters.
- **`<AdBannerSection />` & `<VideoSection />`:** Marketing components controlled by the Admin suite to drive engagement.

## Interactivity & UX

The UX focuses on reducing friction. The use of Redux state ensures that authenticated users are recognized instantly, tailoring the call-to-action buttons (e.g., swapping "Sign Up" for "Book Now"). The layout employs CSS grids, flexboxes, and Tailwind classes like `animate-slide-in-left` and `group-hover` effects to keep the interface dynamic and modern.
