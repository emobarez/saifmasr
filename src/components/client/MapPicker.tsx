"use client";
import { useEffect, useRef, useState } from 'react';

// We lazy-load leaflet to avoid Next.js bundling issues / optional dep loading in edge runtimes
type LeafletModule = typeof import('leaflet');
interface InternalRefs {
  L?: LeafletModule;
}

interface MapPickerProps {
  lat?: number | '';
  lng?: number | '';
  onChange: (coords: { lat: number; lng: number }) => void;
  className?: string;
}

// Basic Leaflet map picker without SSR hazards
export function MapPicker({ lat, lng, onChange, className }: MapPickerProps) {
  const mapRef = useRef<any | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const markerRef = useRef<any | null>(null);
  const leafletRef = useRef<InternalRefs>({});
  const readyRef = useRef(false);
  const [debug, setDebug] = useState<string>('init');
  const [initTried, setInitTried] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const attemptInit = async () => {
      if (cancelled) return;
      if (!containerRef.current || mapRef.current) return;
      const container = containerRef.current;
      const visible = container.offsetWidth > 0 && container.offsetHeight > 0;
      if (!visible) {
        // Defer until visible
        setTimeout(attemptInit, 100);
        return;
      }
      try {
        setDebug('loading-modules');
        const [{ default: L }] = await Promise.all([
          import('leaflet'),
          import('leaflet/dist/leaflet.css').catch(() => null),
        ]);
        if (cancelled) return;
        leafletRef.current.L = L;
        const startLat = typeof lat === 'number' ? lat : 30.0444;
        const startLng = typeof lng === 'number' ? lng : 31.2357;
        setDebug('creating-map');
        const map = L.map(container, {
          center: [startLat, startLng],
          zoom: 13,
          attributionControl: false,
        });
        mapRef.current = map;
        setDebug('adding-tiles');
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
        setDebug('adding-marker');
        markerRef.current = L.marker([startLat, startLng], { draggable: true }).addTo(map);
        markerRef.current.on('dragend', () => {
          const pos = markerRef.current!.getLatLng();
          onChange({ lat: Number(pos.lat.toFixed(6)), lng: Number(pos.lng.toFixed(6)) });
        });
        map.on('click', (e: any) => {
          const { lat: clat, lng: clng } = e.latlng;
          markerRef.current!.setLatLng([clat, clng]);
          onChange({ lat: Number(clat.toFixed(6)), lng: Number(clng.toFixed(6)) });
        });
        setDebug('invalidate-size');
        setTimeout(() => { map.invalidateSize(); }, 30);
        setTimeout(() => { map.invalidateSize(); }, 250);
        map.whenReady(() => {
          readyRef.current = true;
          setDebug('ready');
        });
      } catch (e) {
        console.error('[MapPicker] init failed', e);
        setDebug('error');
      }
    };
    if (!initTried) {
      setInitTried(true);
      attemptInit();
    }
    return () => { cancelled = true; try { mapRef.current?.remove(); } catch {} };
  }, [initTried, lat, lng, onChange]);

  useEffect(() => {
    if (!readyRef.current) return; // wait until whenReady fired
    if (!mapRef.current || !leafletRef.current.L) return;
    if (typeof lat === 'number' && typeof lng === 'number') {
      try {
        const L = leafletRef.current.L as any;
        const pos = L.latLng(lat, lng);
        if (!markerRef.current) {
          markerRef.current = L.marker(pos, { draggable: true }).addTo(mapRef.current);
          markerRef.current.on('dragend', () => {
            const p = markerRef.current!.getLatLng();
            onChange({ lat: Number(p.lat.toFixed(6)), lng: Number(p.lng.toFixed(6)) });
          });
        } else {
          markerRef.current.setLatLng(pos);
        }
        // Skip map positioning to avoid _leaflet_pos errors
        // User can manually pan to see the marker if needed
        // The marker position is the most important part for form data
      } catch (e) {
        console.warn('Leaflet position update skipped', e);
      }
    }
  }, [lat, lng, onChange]);

  return (
    <div className={(className || 'h-72 w-full rounded-md overflow-hidden border') + ' relative leaflet-container'} ref={containerRef}>
      {!readyRef.current && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-xs text-muted-foreground gap-1 bg-background/40">
          <span>تحميل الخريطة...</span>
          <span className="opacity-60">{debug}</span>
        </div>
      )}
    </div>
  );
}
