
import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { InsectEntry } from '../types';

// 色付きマーカーアイコンの作成関数（標準デザインを維持）
const createColoredIcon = (color: string) => {
  // SVGで標準のマーカー形状を作成し、色を変更
  const svgIcon = `
    <svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
      <path fill="${color}" stroke="#fff" stroke-width="1.5" d="M12.5 0C5.6 0 0 5.6 0 12.5c0 8.5 12.5 28.5 12.5 28.5S25 21 25 12.5C25 5.6 19.4 0 12.5 0z"/>
      <circle fill="#fff" cx="12.5" cy="12.5" r="4"/>
    </svg>
  `;
  
  return L.divIcon({
    className: 'custom-colored-marker',
    html: svgIcon,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  });
};

// 自分の投稿用（エメラルドグリーン）
const myEntryIcon = createColoredIcon('#10b981');
// 他人の投稿用（ブルー）
const otherEntryIcon = createColoredIcon('#3b82f6');
// デフォルト（未ログイン時など）
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
  currentUserId: string | null;
}

const RecenterMap = ({ center }: { center: { lat: number; lng: number } }) => {
  const map = useMap();
  const prevCenterRef = useRef<string>('');
  const isInitialMount = useRef(true);
  
  useEffect(() => {
    // 初回マウント時は初期位置を記録してスキップ
    if (isInitialMount.current) {
      isInitialMount.current = false;
      prevCenterRef.current = `${center.lat.toFixed(6)}_${center.lng.toFixed(6)}`;
      return;
    }
    
    // 位置を文字列として比較（より確実に変更を検知）
    const currentKey = `${center.lat.toFixed(6)}_${center.lng.toFixed(6)}`;
    const prevKey = prevCenterRef.current;
    
    // 現在の地図の中心位置を取得
    const currentMapCenter = map.getCenter();
    const mapCenterKey = `${currentMapCenter.lat.toFixed(6)}_${currentMapCenter.lng.toFixed(6)}`;
    const distance = map.distance(currentMapCenter, [center.lat, center.lng]);
    
    // 地図の中心位置と目標位置が異なる場合、またはcenterプロップが変更された場合に移動
    if (prevKey !== currentKey || mapCenterKey !== currentKey) {
      // 距離が10m以上離れている場合はflyTo、それ以外はsetView
      if (distance > 10) {
        // flyToを使用してスムーズに移動
        map.flyTo([center.lat, center.lng], map.getZoom(), {
          duration: 0.5
        });
      } else {
        // 距離が近い場合でも、強制的に移動（ユーザーがボタンを押した場合）
        map.setView([center.lat, center.lng], map.getZoom(), {
          animate: true,
          duration: 0.3
        });
      }
      
      prevCenterRef.current = currentKey;
    }
  }, [center.lat, center.lng, map]);
  
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

const MapComponent: React.FC<MapComponentProps> = ({ entries, center, onMarkerClick, currentUserId }) => {
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
        <RecenterMap center={center} />
        {entries.map((entry) => {
          // 自分の投稿かどうかでアイコンを切り替え
          let markerIcon = defaultIcon;
          if (currentUserId) {
            const isMyEntry = entry.userId === currentUserId;
            markerIcon = isMyEntry ? myEntryIcon : otherEntryIcon;
          }
          
          return (
            <Marker 
              key={entry.id} 
              position={[entry.latitude, entry.longitude]}
              icon={markerIcon}
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
          );
        })}
      </MapContainer>
    </div>
  );
};

export default MapComponent;
