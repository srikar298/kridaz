# Nearby Players Discovery

The **Nearby Players Discovery** module enables users to find, connect with, and challenge other athletes in their geographic vicinity. By integrating interactive map overlays with backend spatial querying (via Redis GEO operations), users can search for active players by sport, skill level, and distance radius.

![Nearby Players Mockup](/img/platform/nearby_players_mockup.png)

## Functional Definition

1. **Geographic Localization:** Uses the browser's Geolocation API to center the map on the user's coordinates.
2. **Interactive Map View:** Renders pins representing active athletes nearby, customized with icons corresponding to their primary sport.
3. **Radius/Sport Filtering:** A floating control panel allows users to filter players within a 2km to 20km radius and toggle specific sports (e.g., Football, Cricket, Badminton).
4. **Quick Connect:** Clicking a player marker pops up a glassmorphism profile summary card with stats, common connections, and options to send a direct follow request or game invitation.

---

## Key Components & Implementation

The geographic player discovery features are built using the following core files:

### 1. `FindPlayers.jsx`

- **Path:** [FindPlayers.jsx](file:///Users/prem/kridaz/client/user/src/pages/FindPlayers.jsx)
- **Functionality:** The top-level page wrapper that coordinates local geolocation queries, filters, and manages sidebar player listing panels.

### 2. `NearbyPlayersMap.jsx` & `PlayerMap.jsx`

- **Paths:** [NearbyPlayersMap.jsx](file:///Users/prem/kridaz/client/user/src/shared/components/map/NearbyPlayersMap.jsx) / [PlayerMap.jsx](file:///Users/prem/kridaz/client/user/src/shared/components/discovery/PlayerMap.jsx)
- **Functionality:** Handles map rendering (via Leaflet or Mapbox API), custom marker placement, cluster overlays, and click bindings.
- **Key Code Snippet:**

  ```javascript
  // Centering map and binding marker click handlers
  import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";

  const ActivePlayersMap = ({ players, userCoords }) => {
    return (
      <MapContainer
        center={userCoords}
        zoom={13}
        className="h-full w-full rounded-2xl"
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        />
        {players.map((player) => (
          <Marker
            key={player.id}
            position={[player.lat, player.lng]}
            icon={createCustomIcon(player.sport)}
          >
            <Popup className="custom-popup">
              <div className="text-white p-2">
                <h4 className="font-bold">{player.name}</h4>
                <p className="text-xs text-[#55DEE8]">
                  {player.skillLevel} &bull; {player.distance}km away
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    );
  };
  ```

### 3. `DiscoveryMapShell.jsx`

- **Path:** [DiscoveryMapShell.jsx](file:///Users/prem/kridaz/client/user/src/shared/components/discovery/DiscoveryMapShell.jsx)
- **Functionality:** A container shell that overlays filter panels, category pills, and quick-detail slides seamlessly over the map area.

---

## Technical Logic & Data Flow

Redis GEO commands power the fast geolocation lookup:

1. **Coord Registration:** When users open the app or map, their current latitude/longitude are posted to `/api/users/location` and stored in Redis using `GEOADD active_users <lng> <lat> <userId>`.
2. **Geofenced Querying:** Toggling filters triggers a search query using `GEORADIUSBYMEMBER` or `GEORADIUS` to retrieve players within the designated kilometer range.
3. **Data Hydration:** Retrieved user IDs are hydrated via MongoDB to extract profile photos, sport levels, and badge details before returning to the frontend.

---

## Styling & Design Integration

- **Map Customization:** Embedded maps use a custom dark cartography style (CartoDB Dark Matter) to match the dark theme of the platform.
- **Markers & Glows:** The user marker is highlighted with a pulse animation using neon cyan (`#55DEE8`), while other player pins glow green (`#BFF367`).
- **Overlay Cards:** Navigation overlay filters and detail cards feature a transparent backdrop design (`rgba(18, 18, 18, 0.75)` with `backdrop-filter: blur(16px)` and a subtle light-gray border).
