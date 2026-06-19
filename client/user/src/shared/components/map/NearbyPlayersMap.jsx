import {
  MapContainer,
  TileLayer,
  useMap,
  useMapEvents,
  Marker,
  Popup,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useMemo } from "react";
import L from "leaflet";
import { Navigation } from "lucide-react";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
import { formatDistanceToNow } from "date-fns";

// Fix default icon issue in Leaflet with Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl,
  shadowUrl: iconShadow,
});

const mapStyles = `
  .pulsing-marker {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: #BFF367;
    border: 3px solid white;
    box-shadow: 0 0 0 4px rgba(85,222,232,0.3);
    animation: pulse 2s infinite;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }
  .pulsing-marker img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  @keyframes pulse {
    0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(85,222,232,0.7); }
    70% { transform: scale(1.1); box-shadow: 0 0 0 10px rgba(85,222,232,0); }
    100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(85,222,232,0); }
  }
  .leaflet-container {
    width: 100%;
    height: 100%;
    background: #0a0a0a !important;
  }
  .premium-map-popup .leaflet-popup-content-wrapper {
    background: rgba(10, 10, 10, 0.9) !important;
    backdrop-filter: blur(12px);
    border: 1px solid rgba(85, 222, 232, 0.3);
    border-radius: 20px;
    padding: 2px;
    box-shadow: 0 10px 40px rgba(0,0,0,0.8);
  }
  .premium-map-popup .leaflet-popup-tip {
    background: rgba(10, 10, 10, 0.9) !important;
    border: 1px solid rgba(85, 222, 232, 0.3);
  }
  .premium-map-popup .leaflet-popup-content {
    margin: 12px;
  }
`;

const MapEventsHandler = ({ onMapMove }) => {
  const map = useMapEvents({
    moveend: () => {
      onMapMove?.(map.getBounds(), map.getZoom());
    },
    zoomend: () => {
      onMapMove?.(map.getBounds(), map.getZoom());
    },
  });

  useEffect(() => {
    onMapMove?.(map.getBounds(), map.getZoom());
  }, []);

  return null;
};

const MapController = ({ userLocation, radiusKm }) => {
  const map = useMap();
  const circleRef = useRef(null);

  useEffect(() => {
    if (userLocation) {
      map.setView([userLocation.lat, userLocation.lng], 14);
    }
  }, [userLocation, map]);

  useEffect(() => {
    if (userLocation && radiusKm) {
      if (circleRef.current) {
        map.removeLayer(circleRef.current);
      }
      circleRef.current = L.circle([userLocation.lat, userLocation.lng], {
        radius: radiusKm * 1000,
        color: "#BFF367",
        fillOpacity: 0.05,
        strokeOpacity: 0.3,
        weight: 1,
      }).addTo(map);
    }
    return () => {
      if (circleRef.current) {
        map.removeLayer(circleRef.current);
      }
    };
  }, [userLocation, radiusKm, map]);

  return null;
};

const getValidAvatar = (url) => {
  const fallback = "https://pngimg.com/d/cricket_PNG102.png";
  return !url || url === "null" || url === "undefined" ? fallback : url;
};

const createClusterIcon = (count, previews) => {
  const avatarsHtml = previews
    .map(
      (p) =>
        `<img src="${getValidAvatar(p.profilePicture)}" 
          style="width:14px;height:14px;border-radius:50%;object-fit:cover;border:1px solid #BFF367" 
          onerror="this.src='https://pngimg.com/d/cricket_PNG102.png'; this.onerror=null;" />`
    )
    .join("");

  const html = `
    <div style="position:relative; cursor:pointer">
      <div style="
        width: 56px; height: 56px;
        border-radius: 50%;
        background: rgba(0,0,0,0.85);
        border: 2.5px solid #BFF367;
        display: flex; align-items: center; justify-content: center;
        flex-wrap: wrap; gap: 2px; padding: 4px;
        box-shadow: 0 0 0 3px rgba(85,222,232,0.2);
      ">
        ${avatarsHtml}
        <div style="
          position:absolute; top:-6px; right:-6px;
          background:#BFF367; color:black;
          border-radius:99px; padding:1px 5px;
          font-size:10px; font-weight:900;
        ">${count}</div>
      </div>
    </div>
  `;
  return L.divIcon({
    html,
    className: "",
    iconSize: [56, 56],
    iconAnchor: [28, 56],
  });
};

const getTimeAgo = (lastSeen) => {
  if (!lastSeen) return null;
  const date = new Date(lastSeen);
  const now = new Date();
  const diffMinutes = (now - date) / (1000 * 60);

  if (diffMinutes < 5) return "Online Now";

  let text = formatDistanceToNow(date, { addSuffix: true });
  text = text.replace("about ", "");
  return `Active ${text}`;
};

const createPlayerIcon = (player) => {
  const isOnline = player.lastSeen
    ? (new Date() - new Date(player.lastSeen)) / (1000 * 60) < 5
    : false;
  const timeAgoText = getTimeAgo(player.lastSeen) || "";

  const markerBorderColor = isOnline ? "#BFF367" : "rgba(255,255,255,0.4)";

  const onlineDot = isOnline
    ? `<div style="position:absolute; bottom:12px; right:-2px; width:12px; height:12px; background:#22c55e; border-radius:50%; border:2px solid #0a0a0a; box-shadow: 0 0 5px rgba(34,197,94,0.5); z-index:10;"></div>`
    : ``;

  const inactiveText =
    !isOnline && timeAgoText
      ? `<div style="position:absolute; bottom:-16px; left:50%; transform:translateX(-50%); background:rgba(0,0,0,0.8); color:#ccc; font-size:9px; padding:2px 5px; border-radius:4px; white-space:nowrap; border:1px solid rgba(255,255,255,0.1); font-family: sans-serif; pointer-events:none;">${timeAgoText}</div>`
      : ``;

  const markerHtml = `
    <div style="position:relative; cursor:pointer">
      <div style="
        width: 40px;
        height: 40px;
        border-radius: 50%;
        border: 2.5px solid ${markerBorderColor};
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0,0,0,0.5);
        background: #0a0a0a;
        position: relative;
      ">
        <img src="${getValidAvatar(player.profilePicture)}" 
             style="width:100%;height:100%;object-fit:cover${!isOnline ? "; filter: grayscale(40%)" : ""}" 
             onerror="this.src='https://pngimg.com/d/cricket_PNG102.png'; this.onerror=null;"
        />
      </div>
      ${onlineDot}
      <div style="
        width: 0; height: 0;
        border-left: 6px solid transparent;
        border-right: 6px solid transparent;
        border-top: 8px solid ${markerBorderColor};
        margin: 0 auto;
      "></div>
      ${inactiveText}
    </div>
  `;
  return L.divIcon({
    html: markerHtml,
    className: "",
    iconSize: [40, 56],
    iconAnchor: [20, 50],
  });
};

const PlayerMarker = ({ player, onPlayerClick }) => {
  const markerRef = useRef(null);

  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.setLatLng([player.lat, player.lng]);
    }
  }, [player.lat, player.lng]);

  const icon = useMemo(
    () => createPlayerIcon(player),
    [player.profilePicture, player.lastSeen]
  );

  return (
    <Marker
      ref={markerRef}
      position={[player.lat, player.lng]}
      icon={icon}
      eventHandlers={{
        click: () => {
          if (onPlayerClick) onPlayerClick(player._id);
        },
      }}
    />
  );
};

const MapResizer = () => {
  const map = useMap();
  useEffect(() => {
    const observer = new ResizeObserver(() => {
      map.invalidateSize();
    });
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map]);
  return null;
};

const MapInner = ({
  nearbyPlayers,
  onPlayerClick,
  userLocation,
  radiusKm,
  onMapMove,
}) => {
  const map = useMap();

  const userIcon = L.divIcon({
    className: "pulsing-marker-container",
    html: `
      <div class="pulsing-marker">
        <img src="${getValidAvatar(userLocation?.profilePicture)}" onerror="this.src='https://pngimg.com/d/cricket_PNG102.png'; this.onerror=null;" />
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });

  return (
    <>
      <MapResizer />
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://carto.com/attributions">CartoDB</a>'
        updateWhenIdle={true}
        keepBuffer={2}
      />

      <MapController userLocation={userLocation} radiusKm={radiusKm} />
      <MapEventsHandler onMapMove={onMapMove} />

      {/* Relocate Button */}
      {userLocation && (
        <div className="absolute bottom-[60px] right-4 z-[1000]">
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              map.flyTo([userLocation.lat, userLocation.lng], 14, {
                duration: 1.5,
              });
            }}
            className="w-10 h-10 bg-black/80 backdrop-blur-xl border border-white/10 rounded-full flex items-center justify-center text-[#BFF367] hover:bg-[#BFF367]/20 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.5)] cursor-pointer"
            title="Locate me"
          >
            <Navigation size={18} className="-ml-0.5 mt-0.5" />
          </button>
        </div>
      )}

      {userLocation && (
        <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
          <Popup>You are here</Popup>
        </Marker>
      )}

      {nearbyPlayers.map((item) => {
        if (item.type === "cluster") {
          return (
            <Marker
              key={item._id}
              position={[item.lat, item.lng]}
              icon={createClusterIcon(item.count, item.previews)}
              eventHandlers={{
                click: () =>
                  map.flyTo([item.lat, item.lng], map.getZoom() + 2, {
                    duration: 0.5,
                  }),
              }}
            />
          );
        }
        return (
          <PlayerMarker
            key={item._id}
            player={item}
            onPlayerClick={onPlayerClick}
          />
        );
      })}
    </>
  );
};

const NearbyPlayersMap = ({
  userLocation,
  nearbyPlayers = [],
  radiusKm,
  onMapMove,
  onPlayerClick,
}) => {
  const defaultCenter = userLocation
    ? [userLocation.lat, userLocation.lng]
    : [20.5937, 78.9629];

  return (
    <div className="w-full h-full relative">
      <style>{mapStyles}</style>
      <MapContainer
        center={defaultCenter}
        zoom={14}
        scrollWheelZoom={true}
        minZoom={10}
        maxZoom={18}
        zoomControl={false}
        preferCanvas={true}
        attributionControl={false}
      >
        <MapInner
          nearbyPlayers={nearbyPlayers}
          onPlayerClick={onPlayerClick}
          userLocation={userLocation}
          radiusKm={radiusKm}
          onMapMove={onMapMove}
        />
      </MapContainer>
    </div>
  );
};

export default NearbyPlayersMap;
