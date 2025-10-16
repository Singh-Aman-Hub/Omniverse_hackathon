// Fix: Declare google as a global constant to resolve TypeScript errors.
declare const google: any;

import type { SafetyReport, SafeHouse, RouteInfo, SOSPayload, VerificationResult, HazardCircle, UserLocation } from '../types';

const MOCK_LATENCY = 800;

// Helper to simulate network delay
const delay = <T,>(data: T): Promise<T> => 
  new Promise(resolve => setTimeout(() => resolve(data), MOCK_LATENCY));

// 1. POST /api/safety
export const getSafetyReport = async (location: { lat: number; lon: number }): Promise<SafetyReport> => {
  console.log('Fetching safety report for:', location);
  const score = Math.floor(Math.random() * 100);
  let risk_level: SafetyReport['risk_level'];
  if (score < 25) risk_level = 'low';
  else if (score < 50) risk_level = 'moderate';
  else if (score < 75) risk_level = 'high';
  else risk_level = 'extreme';

  const mockReport: SafetyReport = {
    safety_score: score,
    risk_level,
    reasons: "Gemini analysis: The availability of med store nearest to you.",
    raw: { openweather: { alerts: [{ event: "Med availability" }] } },
  };
  return delay(mockReport);
};

// 2. GET /api/safehouses - REAL IMPLEMENTATION
export const getSafeHouses = (params: { lat: number, lon: number, radius: number, type: string }): Promise<SafeHouse[]> => {
  console.log('Fetching real safe houses from Google Places API with params:', params);

  return new Promise((resolve, reject) => {
    if (!google || !google.maps || !google.maps.places || !google.maps.geometry) {
      // Retry after a short delay if the script hasn't loaded yet
      return setTimeout(() => {
        if (!google || !google.maps || !google.maps.places || !google.maps.geometry) {
           reject(new Error("Google Maps API with Places and Geometry libraries not loaded."));
        } else {
           resolve(getSafeHouses(params));
        }
      }, 500);
    }
    
    const userLocationLatLng = new google.maps.LatLng(params.lat, params.lon);
    
    // PlacesService requires a map instance or an HTML element. A dummy div works.
    const service = new google.maps.places.PlacesService(document.createElement('div'));

    // Fix: Removed explicit `google.maps.places.PlaceSearchRequest` type to prevent namespace error, as `google` is declared as `any`.
    const request = {
      location: userLocationLatLng,
      radius: params.radius,
      type: params.type,
    };

    service.nearbySearch(request, (results, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && results) {
        const safeHouses: SafeHouse[] = results.map(place => {
          if (!place.place_id || !place.name || !place.geometry?.location) {
            return null;
          }
          const placeLocation = place.geometry.location;
          const distance = google.maps.geometry.spherical.computeDistanceBetween(
            userLocationLatLng,
            placeLocation
          );

          return {
            id: place.place_id,
            name: place.name,
            address: place.vicinity || 'Address not available',
            lat: placeLocation.lat(),
            lon: placeLocation.lng(),
            distance_m: Math.round(distance),
          };
        }).filter((house): house is SafeHouse => house !== null);

        resolve(safeHouses.sort((a, b) => a.distance_m - b.distance_m));
      } else {
        reject(new Error(`PlacesService failed due to: ${status}`));
      }
    });
  });
};


// 3. POST /api/route-check - REAL IMPLEMENTATION
export const checkRoute = (params: { origin: { lat: number; lon: number }; destination: { lat: number; lon: number } }): Promise<RouteInfo> => {
  console.log('Checking route with Google Directions API:', params);

  return new Promise((resolve, reject) => {
    // Check if the Google Maps script is loaded.
    if (!google || !google.maps || !google.maps.DirectionsService) {
      return reject(new Error("Google Maps API with DirectionsService not loaded."));
    }

    const directionsService = new google.maps.DirectionsService();
    
    const request = {
      origin: new google.maps.LatLng(params.origin.lat, params.origin.lon),
      destination: new google.maps.LatLng(params.destination.lat, params.destination.lon),
      travelMode: google.maps.TravelMode.DRIVING,
    };

    directionsService.route(request, (result, status) => {
      if (status === google.maps.DirectionsStatus.OK && result) {
        // Mock the safety check for now
        const isSafe = Math.random() > 0.3;

        const routeInfo: RouteInfo = {
          route_safe: isSafe,
          reason: isSafe ? "Route appears clear of known hazards." : "Route segment intersects a known flood zone. Proceed with caution.",
          // The 'result' from the Directions API matches the structure we need.
          directions: result as any,
        };
        resolve(routeInfo);
      } else {
        reject(new Error(`Directions service failed due to: ${status}`));
      }
    });
  });
};


// 4. POST /api/sos
export const sendSOS = async (payload: SOSPayload): Promise<{ sent: boolean, log_id: string }> => {
  console.log('Sending SOS:', payload);
  const mockResponse = {
    sent: true,
    log_id: `sos_${Date.now()}`,
  };
  return delay(mockResponse);
};

// 5. POST /api/verify-claim
export const verifyClaim = async (payload: { text: string; lat: number; lon: number }): Promise<VerificationResult> => {
  console.log('Verifying claim:', payload);
  const mockResult: VerificationResult = {
    verdict: 'Unverified',
    confidence: 0.65,
    evidence: [
      { title: "City Council Reports Minor Street Flooding After Heavy Rains", url: '#', snippet: 'Local news reports some streets are experiencing minor flooding. Officials advise caution.', source: 'city-news.com' },
      { title: "Social Media Post Shows Water on Main Street", url: '#', snippet: 'A video posted on social media appears to show water covering the road on Main Street.', source: 'Social Media' },
    ],
    explanation: "Gemini analysis: Reports indicate minor, localized flooding in the area mentioned. While official sources confirm rain, the severity of the flood is unverified. It is likely true there is some flooding, but claims of a major event are not substantiated. Advise avoiding the area until official updates are provided.",
  };
  return delay(mockResult);
};

// 6. GET /api/hazards
export const getHazardCircles = async (location: UserLocation): Promise<HazardCircle[]> => {
  console.log('Fetching hazard circles for:', location);
  // This is a mock function. A real implementation would query a weather API.
  // It generates random circles within a ~100km bounding box of the user.
  const circles: HazardCircle[] = [];
  const severities: HazardCircle['severity'][] = ['advisory', 'warning', 'severe'];
  const numCircles = Math.floor(Math.random() * 5) + 3; // 3 to 7 circles

  for (let i = 0; i < numCircles; i++) {
    // 1 degree of latitude is ~111km. 0.5 is ~55km.
    const centerLat = location.lat + (Math.random() - 0.5);
    const centerLng = location.lng + (Math.random() - 0.5);
    const radius = Math.random() * 15000 + 5000; // 5km to 20km radius

    circles.push({
      center: { lat: centerLat, lng: centerLng },
      radius: radius,
      severity: severities[Math.floor(Math.random() * severities.length)],
    });
  }

  return delay(circles);
};