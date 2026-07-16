import { useEffect } from 'react';
import { useMap, useMapEvents } from 'react-leaflet';

// Recenters the map whenever lat/lng props change (Leaflet's `center` prop only applies on first render)
export const RecenterMap = ({ lat, lng, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (lat !== undefined && lng !== undefined && Number.isFinite(lat) && Number.isFinite(lng)) {
      map.setView([lat, lng], zoom || map.getZoom());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lng]);
  return null;
};

// Detects clicks anywhere on the map (Leaflet requires a child component + hook for this, unlike Google's onClick prop)
export const MapClickHandler = ({ onMapClick }) => {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng);
    },
  });
  return null;
};