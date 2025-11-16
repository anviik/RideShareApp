import { useEffect } from "react";

export default function MapView({ markers }) {
  useEffect(() => {
    const map = new window.google.maps.Map(document.getElementById("map"), {
      center: { lat: 37.3, lng: -120.5 }, // Example UC Merced
      zoom: 12,
    });
    markers.forEach((m) => {
      new window.google.maps.Marker({
        position: { lat: m.lat, lng: m.lng },
        map,
        title: m.title,
      });
    });
  }, [markers]);

  return <div id="map" className="h-[400px] rounded-lg" />;
}
