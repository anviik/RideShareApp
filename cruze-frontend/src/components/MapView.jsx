// src/components/MapView.jsx
import { useEffect, useRef, useState } from "react";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const FALLBACK_CENTER = { lat: 37.3636, lng: -120.4241 }; // UC Merced
let googleMapsScriptPromise;

function loadGoogleMaps(apiKey) {
  if (window.google?.maps) return Promise.resolve();

  if (!googleMapsScriptPromise) {
    googleMapsScriptPromise = new Promise((resolve, reject) => {
      const existingScript = document.querySelector(
        'script[data-google-maps="true"]'
      );

      if (existingScript) {
        existingScript.addEventListener("load", () => resolve());
        existingScript.addEventListener("error", () =>
          reject(new Error("Google Maps failed to load"))
        );
        return;
      }

      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.dataset.googleMaps = "true";
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Google Maps failed to load"));
      document.head.appendChild(script);
    });
  }

  return googleMapsScriptPromise;
}

function getUserLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation not supported"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => reject(error),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
}

function MapView() {
  const mapRef = useRef(null);
  const [mapState, setMapState] = useState({
    status: "loading",
    note: "Loading map...",
  });

  useEffect(() => {
    let mapInstance;
    let marker;
    let cancelled = false;

    async function initMap() {
      if (!GOOGLE_MAPS_API_KEY) {
        setMapState({
          status: "error",
          note: "Add VITE_GOOGLE_MAPS_API_KEY to show the map.",
        });
        return;
      }

      try {
        setMapState({ status: "loading", note: "Loading Google Maps..." });
        await loadGoogleMaps(GOOGLE_MAPS_API_KEY);

        let center = FALLBACK_CENTER;

        try {
          setMapState({ status: "loading", note: "Finding your location..." });
          center = await getUserLocation();
        } catch (err) {
          console.warn("Geolocation failed:", err);
          setMapState({
            status: "loading",
            note: "Showing UC Merced while location is unavailable.",
          });
        }

        if (cancelled || !mapRef.current) return;

        mapInstance = new window.google.maps.Map(mapRef.current, {
          center,
          zoom: 14,
          disableDefaultUI: true,
          gestureHandling: "greedy",
        });

        marker = new window.google.maps.Marker({
          position: center,
          map: mapInstance,
          title: "You are here",
        });

        setMapState({
          status: "ready",
          note:
            center === FALLBACK_CENTER
              ? "Using UC Merced as a fallback location."
              : "Showing your current location.",
        });
      } catch (err) {
        if (cancelled) return;
        console.error(err);
        setMapState({
          status: "error",
          note: err?.message || "Could not load Google Maps right now.",
        });
      }
    }

    initMap();

    return () => {
      cancelled = true;
      if (marker) marker.setMap(null);
      mapInstance = null;
    };
  }, []);

  const shouldShowOverlay = mapState.status !== "ready";

  return (
    <div className="relative">
      <div
        ref={mapRef}
        className="h-80 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 shadow"
      />

      {shouldShowOverlay && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur text-sm text-slate-700">
          <div className="space-y-1 text-center">
            <div className="text-xs uppercase tracking-wide text-slate-500">
              {mapState.status === "error" ? "Map unavailable" : "Loading map"}
            </div>
            <div className="text-slate-600">{mapState.note}</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MapView;
