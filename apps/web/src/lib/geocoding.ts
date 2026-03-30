import type { GeocodedAddress } from "@bites-ratings/shared";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

type GeocodeResult = {
  formatted_address?: string;
  geometry: {
    location: {
      lat: () => number;
      lng: () => number;
    };
  };
};

type GeocoderInstance = {
  geocode: (
    request: { address: string },
    callback: (results: GeocodeResult[], status: string) => void,
  ) => void;
};

type GoogleMapsWindow = Window & {
  google?: {
    maps?: {
      Geocoder?: new () => GeocoderInstance;
    };
  };
};

export const geocodeAddress = async (query: string): Promise<GeocodedAddress | null> => {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) {
    return null;
  }

  if (!GOOGLE_MAPS_API_KEY) {
    console.error("Missing VITE_GOOGLE_MAPS_API_KEY");
    return null;
  }

  try {
    const googleMaps = (window as GoogleMapsWindow).google;
    if (!googleMaps?.maps?.Geocoder) {
      console.error("Google Maps JS API not loaded yet");
      return null;
    }

    const geocoder = new googleMaps.maps.Geocoder();
    const geocodeResult = await new Promise<GeocodeResult>((resolve, reject) => {
      geocoder.geocode({ address: trimmedQuery }, (results: GeocodeResult[], status: string) => {
        if (status === "OK" && results.length > 0) {
          resolve(results[0]);
          return;
        }
        reject(new Error(String(status)));
      });
    });

    return {
      address: geocodeResult.formatted_address ?? "",
      latitude: geocodeResult.geometry.location.lat(),
      longitude: geocodeResult.geometry.location.lng(),
    };
  } catch (error) {
    console.error("Geocoding request failed:", error);
    return null;
  }
};
