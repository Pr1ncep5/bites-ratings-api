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