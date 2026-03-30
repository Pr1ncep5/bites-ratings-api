import type {
  PaginatedRestaurants,
  RestaurantListItem,
  PaginatedReviews,
  RestaurantDetails,
  SuccessResponse,
  WeatherDetails,
  ReviewCreate,
  ReviewListItem,
  AdminUserListItem,
  RestaurantCreate,
  ErrorResponse,
} from "@bites-ratings/shared";

const API_URL = import.meta.env.VITE_API_URL;

const getErrorMessage = async (res: Response, fallback: string) => {
  const errorData = (await res.json()) as ErrorResponse;
  if (errorData && typeof errorData.error === "string" && errorData.error.trim().length > 0) {
    return errorData.error;
  }
  return fallback;
};

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

  if (!res.ok) throw new Error(await getErrorMessage(res, "Failed to fetch restaurants"));

  return res.json();
};

export const getRestaurant = async (id: string): Promise<SuccessResponse<RestaurantListItem>> => {
  const res = await fetch(`${API_URL}/restaurants/${id}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error(await getErrorMessage(res, "Failed to fetch restaurant"));
  return res.json();
};

export const getRestaurantDetails = async (id: string): Promise<SuccessResponse<RestaurantDetails>> => {
  const res = await fetch(`${API_URL}/restaurants/${id}/details`, { credentials: "include" });
  if (!res.ok) throw new Error(await getErrorMessage(res, "Failed to fetch details"));
  return res.json();
};

export const getCuisines = async (): Promise<SuccessResponse<string[]>> => {
  const res = await fetch(`${API_URL}/cuisines`, { credentials: "include" });
  if (!res.ok) throw new Error(await getErrorMessage(res, "Failed to fetch cuisines"));
  return res.json();
};

export const getRestaurantWeather = async (id: string): Promise<SuccessResponse<WeatherDetails>> => {
  const res = await fetch(`${API_URL}/restaurants/${id}/weather`, { credentials: "include" });
  if (!res.ok) throw new Error(await getErrorMessage(res, "Failed to fetch weather"));
  return res.json();
};

export const getReviews = async (id: string, page = 1): Promise<SuccessResponse<PaginatedReviews>> => {
  const res = await fetch(`${API_URL}/restaurants/${id}/reviews?page=${page}&limit=10`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error(await getErrorMessage(res, "Failed to fetch reviews"));
  return res.json();
};

export const createReview = async ({
  restaurantId,
  data,
}: {
  restaurantId: string;
  data: ReviewCreate;
}): Promise<SuccessResponse<ReviewListItem>> => {
  const res = await fetch(`${API_URL}/restaurants/${restaurantId}/reviews`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error(await getErrorMessage(res, "Failed to submit review"));
  }

  return res.json();
};

export const searchRestaurants = async (q: string): Promise<SuccessResponse<RestaurantListItem[]>> => {
  const res = await fetch(`${API_URL}/restaurants/search?q=${encodeURIComponent(q)}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error(await getErrorMessage(res, "Search failed"));
  return res.json();
};

export const getUsersForAdmin = async (): Promise<SuccessResponse<AdminUserListItem[]>> => {
  const res = await fetch(`${API_URL}/admin/users`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error(await getErrorMessage(res, "Failed to fetch users list for admin"));
  return res.json();
};

export const updateUserRole = async ({ id, role }: { id: string; role: "admin" | "owner" | "user" }) => {
  const res = await fetch(`${API_URL}/admin/users/${id}/role`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ role }),
  });
  if (!res.ok) throw new Error(await getErrorMessage(res, "Failed to update role"));
  return res.json();
};

export const updateUserBan = async ({ id, banned, banReason }: { id: string; banned: boolean; banReason?: string }) => {
  const res = await fetch(`${API_URL}/admin/users/${id}/ban`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ banned, banReason }),
  });
  if (!res.ok) throw new Error(await getErrorMessage(res, "Failed to update ban status"));
  return res.json();
};

export const getRestaurantsForAdmin = async (): Promise<SuccessResponse<RestaurantListItem[]>> => {
  const res = await fetch(`${API_URL}/admin/restaurants`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error(await getErrorMessage(res, "Failed to fetch restaurants for admin"));
  return res.json();
};

export const createRestaurant = async (data: RestaurantCreate) => {
  const res = await fetch(`${API_URL}/restaurants`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw new Error(await getErrorMessage(res, "Failed to create restaurant"));
  }
  return res.json();
};

export const updateRestaurant = async ({ id, data }: { id: string; data: RestaurantCreate }) => {
  const res = await fetch(`${API_URL}/restaurants/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw new Error(await getErrorMessage(res, "Failed to update restaurant"));
  }
  return res.json();
};

export const softDeleteRestaurant = async (id: string) => {
  const res = await fetch(`${API_URL}/restaurants/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ status: "deleted" }),
  });
  if (!res.ok) {
    throw new Error(await getErrorMessage(res, "Failed to delete restaurant"));
  }
  return res.json();
};
