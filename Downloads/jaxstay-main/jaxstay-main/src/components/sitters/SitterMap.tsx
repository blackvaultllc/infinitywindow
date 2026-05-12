import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default icon paths in bundlers
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});
L.Marker.prototype.options.icon = DefaultIcon;

const HighlightIcon = L.divIcon({
  className: "",
  html: `<div style="background:hsl(var(--primary));color:hsl(var(--primary-foreground));border:2px solid white;border-radius:9999px;width:32px;height:32px;display:grid;place-items:center;font-weight:700;box-shadow:0 4px 12px rgba(0,0,0,.25)">★</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

export type Pin = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  rate?: number | null;
  rating?: number;
  reviewCount?: number;
  city?: string | null;
};

function FitBounds({ pins, center }: { pins: Pin[]; center: { lat: number; lng: number } | null }) {
  const map = useMap();
  useEffect(() => {
    if (pins.length === 0 && !center) return;
    const points = pins.map((p) => [p.lat, p.lng] as [number, number]);
    if (center) points.push([center.lat, center.lng]);
    if (points.length === 1) {
      map.setView(points[0], 11);
    } else if (points.length > 1) {
      map.fitBounds(points, { padding: [40, 40], maxZoom: 12 });
    }
  }, [pins, center, map]);
  return null;
}

export function SitterMap({
  pins,
  center,
  highlightId,
  onPinClick,
  className,
}: {
  pins: Pin[];
  center: { lat: number; lng: number } | null;
  highlightId?: string | null;
  onPinClick?: (id: string) => void;
  className?: string;
}) {
  const initialCenter = useMemo<[number, number]>(() => {
    if (center) return [center.lat, center.lng];
    if (pins.length) return [pins[0].lat, pins[0].lng];
    return [39.5, -98.35]; // US center fallback
  }, [center, pins]);

  return (
    <div
      className={`relative isolate z-0 ${className ?? "h-[60vh] w-full overflow-hidden rounded-2xl border border-border"}`}
    >
      <MapContainer
        center={initialCenter}
        zoom={4}
        scrollWheelZoom
        className="relative z-0 h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds pins={pins} center={center} />
        {center && (
          <Marker
            position={[center.lat, center.lng]}
            zIndexOffset={1000}
            icon={L.divIcon({
              className: "",
              html: `
                <div style="position:relative;width:34px;height:34px;">
                  <span style="position:absolute;inset:0;border-radius:9999px;background:#ef4444;opacity:.35;animation:jaxstay-pulse 1.6s ease-out infinite;"></span>
                  <span style="position:absolute;inset:6px;border-radius:9999px;background:#ef4444;border:3px solid white;box-shadow:0 4px 14px rgba(0,0,0,.35);"></span>
                </div>
                <style>@keyframes jaxstay-pulse{0%{transform:scale(.6);opacity:.55}100%{transform:scale(1.6);opacity:0}}</style>`,
              iconSize: [34, 34],
              iconAnchor: [17, 17],
            })}
          >
            <Popup>You are here</Popup>
          </Marker>
        )}
        {pins.map((p) => (
          <Marker
            key={p.id}
            position={[p.lat, p.lng]}
            icon={p.id === highlightId ? HighlightIcon : DefaultIcon}
            eventHandlers={{ click: () => onPinClick?.(p.id) }}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-600">{p.name}</p>
                {p.city && <p className="text-muted-foreground">{p.city}</p>}
                {p.rate != null && <p className="mt-1">${p.rate} / night</p>}
                {p.rating ? (
                  <p>
                    ★ {p.rating.toFixed(1)} ({p.reviewCount})
                  </p>
                ) : null}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
