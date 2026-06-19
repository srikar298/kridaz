# Venues Discovery

The **Venues Search** module is built to provide users with lightning-fast, location-aware discovery of sports facilities across the platform.

![Venues Mockup](/img/platform/venues_mockup.png)

## UI & UX Features

The interface (`client/user/src/shared/components/search/SearchTurf.jsx`) is designed to handle multiple layers of filtering without cluttering the screen.

### Key Elements

- **Unified Search Bar:** A prominent input field that handles both text queries (e.g., "Olympia Arena") and dynamic location selection.
- **Sport Filter Chips:** Horizontal scrolling pills (`All Sports`, `Football`, `Cricket`, etc.) for quick categorization.
- **Advanced Filters:** A dedicated button to open modal filters for rating thresholds (`4+ Stars`) and price ranges.
- **Venue Cards Grid:** Responsive display of venues. Each card (`TurfCard.jsx`) shows an image, title, sport type, dynamic distance calculation (`2.1km away`), star rating, and hourly price.

## Technical Implementation

### Geolocation & Distance Calculation

To provide accurate "Distance Away" metrics, the component requests the user's browser location. The backend or frontend utility then computes the Haversine distance between the user's coordinates and the venue's geocoded location.

```javascript
// Example usage inside the search handler
const handleSearch = () => {
  const filters = {
    searchTerm,
    city: selectedCity,
    sportType: selectedSport,
    maxDistance: distanceLimit, // based on userLocation
  };
  onSearch(filters); // Triggers API call in parent component
};
```

### Component Architecture

The Search module is built as a reusable `SearchTurf` component, allowing it to be embedded directly on the Homepage hero section or utilized as a standalone full-page directory.

- **Debouncing:** Text inputs inside the search bar utilize debouncing (e.g., via `lodash.debounce` or custom hooks) to prevent excessive API calls while typing.
- **State Preservation:** URL search parameters are synchronized with the component state. This ensures that if a user clicks on a venue and presses the "Back" button, their previous search filters and scroll position remain intact.
