import { MapContainer, TileLayer } from 'react-leaflet';

export default function MapView({ center = [22.9734, 78.6569], zoom = 5, children }) {
  return (
    <MapContainer center={center} zoom={zoom} style={{ height: '500px', width: '100%' }}>
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {children}
    </MapContainer>
  );
}