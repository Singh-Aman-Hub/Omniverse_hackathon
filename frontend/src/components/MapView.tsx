// Fix: Declare google as a global constant to resolve TypeScript errors.
declare const google: any;

import React, { useRef, useEffect, useState } from 'react';
import type { UserLocation, SafeHouse, RouteInfo } from '../types';

interface MapViewProps {
  userLocation: UserLocation | null;
  safeHouses: SafeHouse[];
  routeInfo: RouteInfo | null;
  selectedSafeHouse: SafeHouse | null;
  onSafeHouseClick: (safeHouse: SafeHouse) => void;
  // hazardCircles removed for Med Navig healthcare locator context
  isWeatherOverlayVisible: boolean;
}

// getHazardCircleOptions removed for Med Navig healthcare locator context


export const MapView: React.FC<MapViewProps> = ({ userLocation, safeHouses, routeInfo, selectedSafeHouse, onSafeHouseClick, hazardCircles, isWeatherOverlayVisible }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any | null>(null);
  const userMarker = useRef<any | null>(null);
  const safeHouseMarkers = useRef<any[]>([]);
  const routePolyline = useRef<any | null>(null);
  // hazardCircleInstances removed for Med Navig healthcare locator context
  const [googleMapsReady, setGoogleMapsReady] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      if (google) {
        setGoogleMapsReady(true);
        clearInterval(interval);
      }
    }, 100);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (googleMapsReady && mapRef.current && !mapInstance.current) {
      mapInstance.current = new google.maps.Map(mapRef.current, {
        center: userLocation || { lat: 34.0522, lng: -118.2437 },
        zoom: 12,
        mapTypeId: 'roadmap',
        disableDefaultUI: true,
        styles: mapStyles,
      });
    }
  }, [googleMapsReady, userLocation]);

  useEffect(() => {
    if (mapInstance.current && userLocation) {
      mapInstance.current.setCenter(userLocation);
      if (!userMarker.current) {
        userMarker.current = new google.maps.Marker({
          position: userLocation,
          map: mapInstance.current,
          title: 'Your Location',
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#4285F4',
            fillOpacity: 1,
            strokeColor: 'white',
            strokeWeight: 2,
          },
        });
      } else {
        userMarker.current.setPosition(userLocation);
      }
    }
  }, [userLocation, mapInstance.current]);

  useEffect(() => {
    if (mapInstance.current) {
      safeHouseMarkers.current.forEach(marker => marker.setMap(null));
      safeHouseMarkers.current = [];

      safeHouses.forEach(house => {
        const marker = new google.maps.Marker({
          position: { lat: house.lat, lng: house.lon },
          map: mapInstance.current,
          title: house.name,
          icon: {
            url: house.id === selectedSafeHouse?.id ? 
              'https://maps.google.com/mapfiles/ms/icons/green-dot.png' : 
              'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
            scaledSize: new google.maps.Size(40, 40),
          },
        });
        marker.addListener('click', () => onSafeHouseClick(house));
        safeHouseMarkers.current.push(marker);
      });
    }
  }, [safeHouses, selectedSafeHouse, mapInstance.current, onSafeHouseClick]);
  
  useEffect(() => {
    if (routePolyline.current) {
      routePolyline.current.setMap(null);
    }

    if (mapInstance.current && routeInfo?.directions?.routes?.[0]) {
      const route = routeInfo.directions.routes[0];
      const decodedPath = google.maps.geometry.encoding.decodePath(
        route.overview_polyline
      );
      
      routePolyline.current = new google.maps.Polyline({
        path: decodedPath,
        geodesic: true,
        strokeColor: routeInfo.route_safe ? '#00FF00' : '#FF0000',
        strokeOpacity: 0.8,
        strokeWeight: 5,
      });

      routePolyline.current.setMap(mapInstance.current);
      
      if (route.bounds) {
        mapInstance.current.fitBounds(route.bounds, {top: 50, bottom: 250, left: 50, right: 50});
      }
    }
  }, [routeInfo]);

  // Hazard circles feature removed for Med Navig healthcare locator context


  return <div ref={mapRef} className="h-full w-full" />;
};

const mapStyles: any[] = [
  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#263c3f" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#6b9a76" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#38414e" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#212a37" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9ca5b3" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#746855" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1f2835" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#f3d19c" }],
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#2f3948" }],
  },
  {
    featureType: "transit.station",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#17263c" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#515c6d" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#17263c" }],
  },
];