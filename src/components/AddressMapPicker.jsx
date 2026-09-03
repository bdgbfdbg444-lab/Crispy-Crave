import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation, Building2, Home, Layers, Check, AlertCircle } from 'lucide-react';

// Custom SVG Leaflet Pin Icon to avoid missing asset paths
const pinIconSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="36" height="36">
  <path fill="#EF4444" stroke="#FFFFFF" stroke-width="1.5" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
  <circle cx="12" cy="9" r="3" fill="#FFFFFF"/>
</svg>`;

const customIcon = L.divIcon({
  html: pinIconSvg,
  className: 'custom-map-pin',
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36]
});

export const formatAddressDetails = (data) => {
  const parts = [];
  if (data.street) parts.push(`شارع ${data.street.trim()}`);
  if (data.building) parts.push(`عمارة ${data.building.trim()}`);
  if (data.floor) parts.push(`الدور ${data.floor.trim()}`);
  if (data.apartment) parts.push(`شقة ${data.apartment.trim()}`);
  if (data.landmark) parts.push(`(علامة مميزة: ${data.landmark.trim()})`);
  return parts.join(' - ');
};

export default function AddressMapPicker({
  value,
  onChange,
  zonesList = [],
  lang = 'ar',
  disabled = false
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  const [locatingGps, setLocatingGps] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [gpsError, setGpsError] = useState('');
  const [detectedZoneName, setDetectedZoneName] = useState('');

  // Local state for individual fields initialized from value
  const [formData, setFormData] = useState({
    street: value?.street || '',
    building: value?.building || '',
    floor: value?.floor || '',
    apartment: value?.apartment || '',
    landmark: value?.landmark || '',
    zone: value?.zone || '',
    lat: value?.lat || 31.2001,
    lng: value?.lng || 29.9187,
    mapsUrl: value?.mapsUrl || ''
  });

  useEffect(() => {
    if (value) {
      setFormData(prev => ({
        ...prev,
        ...value
      }));
    }
  }, [value]);

  const updateParent = (updated) => {
    setFormData(updated);
    const fullAddress = formatAddressDetails(updated);
    const mapsUrl = updated.lat && updated.lng ? `https://maps.google.com/?q=${updated.lat},${updated.lng}` : '';
    if (onChange) {
      onChange({
        ...updated,
        fullAddress,
        mapsUrl
      });
    }
  };

  // Reverse geocoding function
  const reverseGeocode = async (lat, lng) => {
    setGeocoding(true);
    setGpsError('');
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=ar`, {
        headers: { 'Accept-Language': 'ar' }
      });
      const data = await res.json();
      
      let streetName = '';
      let zoneDetected = '';

      if (data && data.address) {
        const addr = data.address;
        streetName = addr.road || addr.pedestrian || addr.street || addr.neighbourhood || '';
        
        // Match against zonesList
        const searchPool = [
          addr.suburb,
          addr.neighbourhood,
          addr.quarter,
          addr.city_district,
          addr.district,
          data.display_name
        ].filter(Boolean).join(' ');

        for (const z of zonesList) {
          const cleanZone = (z.name || '').replace(/[\/\-]/g, ' ').trim();
          const tokens = cleanZone.split(/\s+/).filter(t => t.length > 2);
          const matched = tokens.some(t => searchPool.includes(t));
          if (matched) {
            zoneDetected = z.name;
            break;
          }
        }
      }

      setDetectedZoneName(zoneDetected);

      const next = {
        ...formData,
        lat,
        lng,
        mapsUrl: `https://maps.google.com/?q=${lat},${lng}`,
        street: streetName || formData.street,
        zone: zoneDetected || formData.zone
      };
      updateParent(next);
    } catch (err) {
      console.warn('Reverse geocoding error:', err);
    } finally {
      setGeocoding(false);
    }
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return; // already initialized

    const initialLat = formData.lat || 31.2001;
    const initialLng = formData.lng || 29.9187;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 14,
      attributionControl: false
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(map);

    const marker = L.marker([initialLat, initialLng], {
      icon: customIcon,
      draggable: true
    }).addTo(map);

    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      reverseGeocode(pos.lat, pos.lng);
    });

    map.on('click', (e) => {
      marker.setLatLng(e.latlng);
      reverseGeocode(e.latlng.lat, e.latlng.lng);
    });

    mapInstanceRef.current = map;
    markerRef.current = marker;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update map marker when coordinates change externally
  useEffect(() => {
    if (mapInstanceRef.current && markerRef.current && formData.lat && formData.lng) {
      markerRef.current.setLatLng([formData.lat, formData.lng]);
    }
  }, [formData.lat, formData.lng]);

  // Handle GPS location click
  const handleGetLiveGps = () => {
    if (!navigator.geolocation) {
      setGpsError('متصفحك لا يدعم خاصية تحديد الموقع الجغرافي (GPS).');
      return;
    }

    setLocatingGps(true);
    setGpsError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.setView([latitude, longitude], 17);
          markerRef.current.setLatLng([latitude, longitude]);
        }
        reverseGeocode(latitude, longitude);
        setLocatingGps(false);
      },
      (err) => {
        setLocatingGps(false);
        if (err.code === 1) {
          setGpsError('يرجى السماح بصلاحية الموقع (Location Permission) في المتصفح لتحديد مكانك.');
        } else {
          setGpsError('تعذر تحديد موقعك بدقة، يمكنك تحديد موقعك يدوياً على الخريطة.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0
      }
    );
  };

  const handleFieldChange = (field, val) => {
    const updated = {
      ...formData,
      [field]: val
    };
    updateParent(updated);
  };

  return (
    <div className="space-y-4">
      {/* Map Card */}
      <div className="bg-black-surface border border-brand-red-dark/40 rounded-2xl p-3 overflow-hidden shadow-lg">
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-xs font-bold text-text-light flex items-center gap-1.5">
            <MapPin size={15} className="text-brand-red" />
            {lang === 'en' ? 'Pin Delivery Location on Map' : 'حدد موقع التوصيل على الخريطة (أو حرك الدبوس)'}
          </span>
          <button
            type="button"
            onClick={handleGetLiveGps}
            disabled={locatingGps}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all shadow-md active:scale-95 disabled:opacity-50"
          >
            <Navigation size={13} className={locatingGps ? 'animate-spin' : ''} />
            <span>{locatingGps ? 'جاري تحديد موقعك...' : (lang === 'en' ? 'Use Current GPS' : '📍 مكاني الحالي')}</span>
          </button>
        </div>

        {/* The Leaflet Map Canvas */}
        <div 
          ref={mapContainerRef} 
          className="w-full h-44 rounded-xl border border-brand-red-dark/30 z-0 cursor-crosshair relative"
          style={{ minHeight: '176px' }}
        />

        {geocoding && (
          <div className="mt-2 text-xs text-amber-400 font-semibold flex items-center gap-1">
            <div className="w-3 h-3 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
            <span>جاري قراءة تفاصيل الشارع والمنطقة من الخريطة...</span>
          </div>
        )}

        {detectedZoneName && (
          <div className="mt-2 text-xs text-emerald-400 font-bold flex items-center gap-1">
            <Check size={14} />
            <span>تم تحديد المنطقة تلقائياً: {detectedZoneName}</span>
          </div>
        )}

        {gpsError && (
          <div className="mt-2 p-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs font-semibold flex items-center gap-1.5">
            <AlertCircle size={14} className="shrink-0" />
            <span>{gpsError}</span>
          </div>
        )}
      </div>

      {/* Structured Address Fields Grid */}
      <div className="space-y-3">
        {/* Zone Selector */}
        <div>
          <label className="block text-xs font-bold text-text-light mb-1.5">
            {lang === 'en' ? 'Delivery Area / Zone *' : 'منطقة التوصيل السكنية *'}
          </label>
          <select
            required
            disabled={disabled}
            value={formData.zone}
            onChange={(e) => handleFieldChange('zone', e.target.value)}
            className="w-full bg-black-surface border border-brand-red-dark/30 text-text-light p-2.5 rounded-xl font-bold text-sm focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red"
          >
            <option value="">{lang === 'en' ? '-- Select Area --' : '-- اختر المنطقة السكنية --'}</option>
            {zonesList.map(z => (
              <option key={z.id || z.name} value={z.name}>{z.name}</option>
            ))}
          </select>
        </div>

        {/* Street Name */}
        <div>
          <label className="block text-xs font-bold text-text-light mb-1.5">
            {lang === 'en' ? 'Street Name *' : 'اسم الشارع *'}
          </label>
          <input
            type="text"
            required
            placeholder={lang === 'en' ? 'e.g. Fawzy Moaz St.' : 'مثال: شارع فوزي معاذ'}
            value={formData.street}
            onChange={(e) => handleFieldChange('street', e.target.value)}
            className="w-full bg-black-surface border border-brand-red-dark/30 text-text-light p-2.5 rounded-xl text-sm focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red"
          />
        </div>

        {/* Building, Floor, Apartment Grid */}
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-xs font-bold text-text-light mb-1.5">
              {lang === 'en' ? 'Building *' : 'رقم/اسم العمارة *'}
            </label>
            <input
              type="text"
              required
              placeholder="مثال: عمارة 15"
              value={formData.building}
              onChange={(e) => handleFieldChange('building', e.target.value)}
              className="w-full bg-black-surface border border-brand-red-dark/30 text-text-light p-2.5 rounded-xl text-sm focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-text-light mb-1.5">
              {lang === 'en' ? 'Floor *' : 'الدور *'}
            </label>
            <input
              type="text"
              required
              placeholder="مثال: 4"
              value={formData.floor}
              onChange={(e) => handleFieldChange('floor', e.target.value)}
              className="w-full bg-black-surface border border-brand-red-dark/30 text-text-light p-2.5 rounded-xl text-sm focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-text-light mb-1.5">
              {lang === 'en' ? 'Apartment *' : 'رقم الشقة *'}
            </label>
            <input
              type="text"
              required
              placeholder="مثال: 8"
              value={formData.apartment}
              onChange={(e) => handleFieldChange('apartment', e.target.value)}
              className="w-full bg-black-surface border border-brand-red-dark/30 text-text-light p-2.5 rounded-xl text-sm focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red"
            />
          </div>
        </div>

        {/* Landmark (Optional) */}
        <div>
          <label className="block text-xs font-bold text-text-muted mb-1.5">
            {lang === 'en' ? 'Landmark (Optional)' : 'علامة مميزة (اختياري للطيار)'}
          </label>
          <input
            type="text"
            placeholder={lang === 'en' ? 'e.g. Near Khalil Pharmacy' : 'مثال: بجوار صيدلية خليل، أمام المسجد'}
            value={formData.landmark}
            onChange={(e) => handleFieldChange('landmark', e.target.value)}
            className="w-full bg-black-surface border border-brand-red-dark/30 text-text-light p-2.5 rounded-xl text-sm focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red"
          />
        </div>
      </div>
    </div>
  );
}
