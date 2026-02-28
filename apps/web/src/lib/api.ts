import type {
  PaginatedRestaurants,
  SuccessResponse
} from "@bites-ratings/shared";

const API = import.meta.env.VITE_API_URL;

export const getRestaurants = async (
  page: number,
  cuisine?: string,
): Promise<SuccessResponse<PaginatedRestaurants>> => {
  const params = new URLSearchParams({ page: String(page), limit: "10" });

  if (cuisine) {
    params.set("cuisine", cuisine);
  }

  const res = await fetch(`${API}/restaurants?${params}`, {
    credentials: "include",
  });

  if (!res.ok) throw new Error("Failed to fetch restaurants");

  return res.json();
};

export const getCuisines = async (): Promise<SuccessResponse<string[]>> => {
  const res = await fetch(`${API}/cuisines`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch cuisines");
  return res.json();
};
