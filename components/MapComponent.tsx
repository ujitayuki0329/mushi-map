
import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { InsectEntry } from '../types';

// Standard CDN URLs for Leaflet markers to avoid import issues
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

interface MapComponentProps {
  entries: InsectEntry[];
  center: { lat: number; lng: number };
  onMarkerClick: (entry: InsectEntry) => void;
}

const RecenterMap = ({ lat, lng }: { lat: number; lng: number }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], 13);
  }, [lat, lng, map]);
  return null;
};

// Fix map size calculation issues
const MapSizeFix = () => {
  const map = useMap();
  
  useEffect(() => {
    // Fix size when component mounts
    setTimeout(() => {
      map.invalidateSize();
    }, 100);
    
    // Fix size on window resize
    const handleResize = () => {
      setTimeout(() => {
        map.invalidateSize();
      }, 100);
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [map]);
  
  return null;
};

const MapComponent: React.FC<MapComponentProps> = ({ entries, center, onMarkerClick }) => {
  return (
    <div className="w-full h-full relative z-0" style={{ minHeight: '100%' }}>
      <MapContainer 
        center={[center.lat, center.lng]} 
        zoom={13} 
        scrollWheelZoom={true}
        className="w-full h-full"
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapSizeFix />
        <RecenterMap lat={center.lat} lng={center.lng} />
        {entries.map((entry) => (
          <Marker 
            key={entry.id} 
            position={[entry.latitude, entry.longitude]}
            icon={defaultIcon}
            eventHandlers={{
              click: () => onMarkerClick(entry),
            }}
          >
            <Popup>
              <div className="p-1 min-w-[120px]">
                <p className="font-bold text-sm mb-1">{entry.name}</p>
                {entry.imageUrl && (
                  <img src={entry.imageUrl} alt={entry.name} className="w-full h-24 object-cover rounded mb-1" />
                )}
                <p className="text-xs text-gray-600 line-clamp-2">{entry.memo}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default MapComponent;
