"use client";
import React, { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import type * as LeafletNS from 'leaflet';
let L: typeof LeafletNS | null = null;

// Fix default marker icon paths for bundlers
try {
  const iconRetina = new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).toString();
  const icon = new URL('leaflet/dist/images/marker-icon.png', import.meta.url).toString();
  const shadow = new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).toString();
  L.Icon.Default.mergeOptions({ iconRetinaUrl: iconRetina, iconUrl: icon, shadowUrl: shadow });
} catch {}

interface PickerProps {
  value?: { lat: number; lng: number };
  onChange: (coords: { lat: number; lng: number }) => void;
  className?: string;
  heightClass?: string; // Tailwind class e.g. h-72
  readOnly?: boolean; // If true, disable dragging and clicking
}

export const LeafletMapPicker: React.FC<PickerProps> = ({ value, onChange, className, heightClass = 'h-72', readOnly = false }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any | null>(null);
  const markerRef = useRef<any | null>(null);
  // NOTE: Avoid dynamic arbitrary class generation so Tailwind doesn't purge it.

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!containerRef.current || mapRef.current) return;
      if (!L) {
        L = await import('leaflet');
      }
      if (cancelled) return;
      try {
        // Ensure default icon images resolve correctly in Next.js bundle
        const iconRetina = new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).toString();
        const icon = new URL('leaflet/dist/images/marker-icon.png', import.meta.url).toString();
        const shadow = new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).toString();
        (L as any).Icon.Default.mergeOptions({ iconRetinaUrl: iconRetina, iconUrl: icon, shadowUrl: shadow });
      } catch {}
      const start = value || { lat: 30.0444, lng: 31.2357 };
      mapRef.current = L!.map(containerRef.current, { 
        center: [start.lat, start.lng], 
        zoom: 13, 
        attributionControl: false,
        dragging: !readOnly,
        touchZoom: !readOnly,
        scrollWheelZoom: !readOnly,
        doubleClickZoom: !readOnly,
        boxZoom: !readOnly,
        keyboard: !readOnly
      });
      L!.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(mapRef.current);
      markerRef.current = L!.marker([start.lat, start.lng], { draggable: !readOnly }).addTo(mapRef.current);
      
      if (!readOnly) {
        markerRef.current.on('dragend', () => {
          const pos = markerRef.current.getLatLng();
          onChange({ lat: Number(pos.lat.toFixed(6)), lng: Number(pos.lng.toFixed(6)) });
        });
        mapRef.current.on('click', (e: any) => {
          const { lat: clat, lng: clng } = e.latlng;
          markerRef.current.setLatLng([clat, clng]);
          onChange({ lat: Number(clat.toFixed(6)), lng: Number(clng.toFixed(6)) });
        });
      }
      
      setTimeout(() => mapRef.current.invalidateSize(), 50);
    })();
    return () => { cancelled = true; try { mapRef.current?.remove(); } catch {} };
  }, [readOnly]);

  // External value sync
  useEffect(() => {
    if (!mapRef.current || !markerRef.current || !value || !L) return;
    markerRef.current.setLatLng([value.lat, value.lng]);
    try {
      const currentZoom = mapRef.current.getZoom?.() ?? 13;
      const targetZoom = 16; // desired zoom when focusing on a selected / geolocated point
      // If user hasn't zoomed in yet, jump (setView) else smooth pan
      if (currentZoom < 14) {
        mapRef.current.setView([value.lat, value.lng], targetZoom, { animate: true });
      } else {
        mapRef.current.panTo([value.lat, value.lng]);
      }
    } catch {}
  }, [value]);

  return <div ref={containerRef} className={(className ? className + ' ' : '') + heightClass + ' w-full rounded-md overflow-hidden border bg-neutral-800 relative'}>
    {!mapRef.current && <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">تحميل الخريطة...</div>}
  </div>;
};

export default LeafletMapPicker;
