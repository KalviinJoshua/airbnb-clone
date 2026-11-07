import React, { useEffect, useRef, useState } from 'react';

/**
 * PropertyMap Component
 * Displays the accommodation's geographic location using Leaflet and OpenStreetMap.
 * Geocodes the text location via OpenStreetMap Nominatim with safe error handling and fallbacks.
 */
export default function PropertyMap({ location, title }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [mapStatus, setMapStatus] = useState('loading'); // 'loading' | 'ready' | 'fallback'
  const [coords, setCoords] = useState(null);

  // 1. Geocode location query using OpenStreetMap Nominatim
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    async function geocodeLocation() {
      if (!location || !location.trim()) {
        if (isMounted) setMapStatus('fallback');
        return;
      }

      try {
        setMapStatus('loading');
        const query = encodeURIComponent(location.trim());
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`,
          {
            signal: controller.signal,
            headers: {
              'Accept': 'application/json',
            },
          }
        );

        if (!response.ok) {
          throw new Error('Geocoding service unavailable');
        }

        const data = await response.json();

        if (isMounted) {
          if (data && data.length > 0) {
            const lat = parseFloat(data[0].lat);
            const lon = parseFloat(data[0].lon);
            setCoords([lat, lon]);
            setMapStatus('ready');
          } else {
            // Location could not be resolved by Nominatim
            setMapStatus('fallback');
          }
        }
      } catch (err) {
        if (isMounted) {
          // If network failed, aborted, or geocoding is rate-limited, fail gracefully
          setMapStatus('fallback');
        }
      } finally {
        clearTimeout(timeoutId);
      }
    }

    geocodeLocation();

    return () => {
      isMounted = false;
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [location]);

  // 2. Initialize or update Leaflet Map
  useEffect(() => {
    if (mapStatus !== 'ready' || !coords || !mapContainerRef.current) return;

    // Check if Leaflet window.L is available
    if (typeof window === 'undefined' || !window.L) {
      setMapStatus('fallback');
      return;
    }

    // Clean up previous map instance if any
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    try {
      const L = window.L;
      const [lat, lon] = coords;

      // Create map
      const map = L.map(mapContainerRef.current, {
        center: [lat, lon],
        zoom: 13,
        scrollWheelZoom: false, // Prevent page scrolling trap
      });

      mapInstanceRef.current = map;

      // OpenStreetMap tile layer (free and requires no API keys)
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      // Custom pulse circle / marker
      L.circle([lat, lon], {
        color: '#ff385c',
        fillColor: '#ff385c',
        fillOpacity: 0.25,
        radius: 400,
      }).addTo(map);

      L.marker([lat, lon])
        .addTo(map)
        .bindPopup(
          `<strong>${title || 'Listing Location'}</strong><br/>${location}`
        )
        .openPopup();
    } catch (error) {
      setMapStatus('fallback');
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [coords, mapStatus, title, location]);

  return (
    <div className="property-map-section">
      <h3 className="details-section-title">Where you'll be</h3>
      <p className="property-map-location-text">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z" />
        </svg>
        <span>{location}</span>
      </p>

      {/* Map Container */}
      <div className="property-map-frame">
        {mapStatus === 'loading' && (
          <div className="map-placeholder-box">
            <div className="spinner" style={{ width: '32px', height: '32px' }} />
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Loading map view...
            </span>
          </div>
        )}

        {mapStatus === 'fallback' && (
          <div className="map-fallback-box">
            <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="#ff385c" strokeWidth="1.5">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <div>
              <p style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                {location}
              </p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Exact location map preview is approximate. Full check-in directions are provided upon booking confirmation.
              </p>
            </div>
          </div>
        )}

        {/* The Leaflet map element */}
        <div
          ref={mapContainerRef}
          className="leaflet-map-canvas"
          style={{ display: mapStatus === 'ready' ? 'block' : 'none' }}
        />
      </div>
    </div>
  );
}
