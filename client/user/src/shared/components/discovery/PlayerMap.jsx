import React, { useState, useEffect, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
  ZoomControl,
  Circle,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Navigation } from "lucide-react";
import { Button } from "@kridaz/ui";


// Fix Leaflet default icon issues
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const MapController = ({ userLocation, setMap }) => {
  const map = useMap();
  useEffect(() => {
    if (map) {
      setMap(map);
    }
  }, [map, setMap]);

  return null;
};

const createMarkerIcon = (item, type) => {
  const pic =
    item.profilePicture ||
    item.logo ||
    item.image ||
    "https://bms-common-bucket.s3.ap-south-1.amazonaws.com/default-avatar.png";
  const mainColor = type === "players" ? "var(--primary)" : "#3B82F6";
  const shadowColor =
    type === "players" ? "rgba(85,222,232,0.3)" : "rgba(59,130,246,0.3)";

  const iconHtml = `
    <div class="relative flex items-center justify-center w-10 h-10">
      <div class="absolute inset-0 rounded-full blur-sm animate-pulse" style="background-color: ${mainColor}33"></div>
      <div class="relative bg-background rounded-full p-0.5 shadow-[0_0_15px_${shadowColor}] overflow-hidden flex items-center justify-center w-9 h-9" style="border: 2px solid ${mainColor}">
        <img src="${pic}" class="w-full h-full object-cover" style="border-radius: 50%;" alt="" />
      </div>
      <div class="absolute -bottom-1 w-2 h-2 rounded-full border border-black shadow-[0_0_5px_${mainColor}]" style="background-color: ${mainColor}"></div>
    </div>
  `;

  return L.divIcon({
    html: iconHtml,
    className: `custom-${type}-marker`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
};

const PlayerMap = ({
  items = [],
  itemType = "players",
  userLocation,
  onItemClick,
  onViewportChange,
  height,
  selectedRadius = 5,
}) => {
  const [mapInstance, setMapInstance] = useState(null);

  // Handle map invalidation when height changes
  useEffect(() => {
    if (mapInstance) {
      setTimeout(() => {
        mapInstance.invalidateSize();
      }, 100);
    }
  }, [height, mapInstance]);

  const currentUserIcon = useMemo(
    () =>
      L.divIcon({
        html: `
      <div class="relative flex items-center justify-center w-12 h-12">
        <div class="absolute inset-0 bg-primary/20 rounded-full animate-ping opacity-20"></div>
        <div class="absolute inset-2 bg-primary/40 rounded-full animate-pulse"></div>
        <div class="relative w-4 h-4 bg-primary rounded-full border-2 border-black shadow-[0_0_15px_var(--primary)]"></div>
      </div>
    `,
        className: "current-user-marker",
        iconSize: [48, 48],
        iconAnchor: [24, 24],
      }),
    []
  );

  const handleRecenter = () => {
    if (mapInstance && userLocation) {
      const pos = Array.isArray(userLocation)
        ? userLocation
        : [userLocation.lat, userLocation.lng];
      mapInstance.flyTo(pos, 15, {
        duration: 1.5,
        easeLinearity: 0.25,
      });
    }
  };

  const mapCenter = useMemo(() => {
    if (!userLocation) return [20.5937, 78.9629];
    return Array.isArray(userLocation)
      ? userLocation
      : [userLocation.lat, userLocation.lng];
  }, [userLocation]);

  return (
    <div className="w-full h-full relative bg-background">
      <MapContainer
        center={mapCenter}
        zoom={14}
        style={{ height: "100%", width: "100%", background: "var(--background)" }}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
          subdomains="abcd"
          maxZoom={20}
        />

        <ZoomControl position="bottomright" />
        <MapController userLocation={userLocation} setMap={setMapInstance} />

        {userLocation && (
          <>
            <Marker position={mapCenter} icon={currentUserIcon}>
              <Popup className="custom-popup-user">
                <div className="text-[10px] font-black text-black uppercase tracking-widest px-2 py-1">
                  You are here
                </div>
              </Popup>
            </Marker>
            <Circle
              center={mapCenter}
              radius={selectedRadius * 1000}
              pathOptions={{
                fillColor: "var(--primary)",
                fillOpacity: 0.05,
                color: "var(--primary)",
                weight: 1,
                dashArray: "5, 10",
              }}
            />
          </>
        )}

        {items?.map((item) => {
          const coords =
            item.locationData?.coordinates ||
            (item.lat && item.lng ? [item.lng, item.lat] : null);
          if (!coords || !Array.isArray(coords) || coords.length < 2)
            return null;

          const [lng, lat] = coords;
          if (isNaN(lat) || isNaN(lng)) return null;

          return (
            <Marker
              key={item._id}
              position={[lat, lng]}
              icon={createMarkerIcon(item, itemType)}
            >
              <Popup className={`custom-${itemType}-popup`}>
                <div className="flex flex-col gap-3 p-1 min-w-[160px] bg-black text-white">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-10 h-10 rounded-full border-2 border-${itemType === "players" ? "[var(--primary)]" : "[#3B82F6]"} overflow-hidden bg-black flex-shrink-0 shadow-[0_0_10px_rgba(0,0,0,0.5)]`}
                    >
                      <img
                        src={
                          item.profilePicture ||
                          item.logo ||
                          item.image ||
                          "https://bms-common-bucket.s3.ap-south-1.amazonaws.com/default-avatar.png"
                        }
                        className="w-full h-full object-cover"
                        alt={item.name}
                        style={{ borderRadius: "50%" }}
                      />
                    </div>
                    <div className="overflow-hidden">
                      <h3 className="font-black text-white text-[11px] uppercase tracking-tight truncate leading-none mb-1">
                        {item.name}
                      </h3>
                      <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest leading-none">
                        {itemType === "players"
                          ? `@${item.username}`
                          : `${item.sportType} Team`}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {itemType === "players" ? (
                      item.sportTypes?.slice(0, 2).map((s) => (
                        <span
                          key={s}
                          className="text-[8px] bg-primary/10 text-primary px-2 py-0.5 rounded-md border border-primary/20 font-black uppercase tracking-widest"
                        >
                          {s}
                        </span>
                      ))
                    ) : (
                      <span className="text-[8px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-md border border-blue-500/20 font-black uppercase tracking-widest">
                        {item.memberCount || 0} MEMBERS
                      </span>
                    )}
                    {item.distance && (
                      <span className="text-[8px] bg-white/5 text-white/40 px-2 py-0.5 rounded-md border border-white/10 font-bold tracking-widest">
                        {(item.distance / 1000).toFixed(1)} KM AWAY
                      </span>
                    )}
                  </div>

                  <Button
                    onClick={() => onItemClick?.(item._id)}
                    className={`w-full bg-${itemType === "players" ? "[var(--primary)]" : "[#3B82F6]"} text-black text-[10px] font-black py-2 rounded-lg mt-1 transition-all uppercase tracking-[0.1em] shadow-lg`}
                  >
                    {itemType === "players" ? "VIEW IN LIST" : "VIEW TEAM"}
                  </Button>
                </div>
              </Popup>
            </Marker>
          );
        })}

        <MapEvents onViewportChange={onViewportChange} />
      </MapContainer>

      {/* Custom Map Controls Overlay */}
      <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
        <Button
          onClick={handleRecenter}
          className="w-10 h-10 bg-black/80 backdrop-blur-md border border-primary/30 rounded-[8px] flex items-center justify-center text-primary hover:bg-primary hover:text-black transition-all shadow-2xl"
          title="Recenter Map"
         aria-label="Recenter Map">
          <Navigation size={18} />
        </Button>
      </div>
    </div>
  );
};

const MapEvents = ({ onViewportChange }) => {
  const map = useMapEvents({
    moveend: () => {
      const center = map.getCenter();
      onViewportChange?.({
        lat: center.lat,
        lng: center.lng,
        zoom: map.getZoom(),
        bounds: map.getBounds(),
      });
    },
  });
  return null;
};

export default PlayerMap;
