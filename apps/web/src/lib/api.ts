import type {
  PaginatedRestaurants,
  PaginatedReviews,
  RestaurantDetails,
  SuccessResponse,
  WeatherDetails
} from "@bites-ratings/shared";

const API_URL = import.meta.env.VITE_API_URL;

export const getRestaurants = async (
  page: number,
  cuisine?: string,
): Promise<SuccessResponse<PaginatedRestaurants>> => {
  const params = new URLSearchParams({ page: String(page), limit: "10" });

  if (cuisine) {
    params.set("cuisine", cuisine);
  }

  const res = await fetch(`${API_URL}/restaurants?${params}`, {
    credentials: "include",
  });

  if (!res.ok) throw new Error("Failed to fetch restaurants");

  return res.json();
};

export const getCuisines = async (): Promise<SuccessResponse<string[]>> => {
  const res = await fetch(`${API_URL}/cuisines`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch cuisines");
  return res.json();
};

export const getRestaurantDetails = async (id: string): Promise<SuccessResponse<RestaurantDetails>> => {
  const res = await fetch(`${API_URL}/restaurants/${id}/details`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch details");
  return res.json();
};

export const getRestaurantWeather = async (id: string): Promise<SuccessResponse<WeatherDetails>> => {
  const res = await fetch(`${API_URL}/restaurants/${id}/weather`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch weather");
  return res.json();
};

export const getReviews = async (id: string, page = 1): Promise<SuccessResponse<PaginatedReviews>> => {
  const res = await fetch(`${API_URL}/restaurants/${id}/reviews?page=${page}&limit=10`, {
    credentials: "include"
  });
  if (!res.ok) throw new Error("Failed to fetch reviews");
  return res.json();
};