export * from "./permissions";
export * from "./responses";
export * from "./restaurants";
export * from "./reviews";
export * from "./admin";

export type WeatherDetails = {
    weather: {
        main: string;
        description: string;
        icon: string;
    }[];
    main: {
        temp: number;
        feels_like: number;
        humidity: number;
    };
    name: string;
};

export type GeocodedAddress = {
    address: string;
    latitude: number;
    longitude: number;
};

export interface GoogleGeocodeResponse {
    status: "OK" | "ZERO_RESULTS" | "OVER_QUERY_LIMIT" | "REQUEST_DENIED" | "INVALID_REQUEST" | "UNKNOWN_ERROR";
    results: {
        formatted_address: string;
        geometry: {
            location: {
                lat: number;
                lng: number;
            };
        };
    }[];
    error_message?: string;
}