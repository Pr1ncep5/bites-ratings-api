import { createFileRoute } from "@tanstack/react-router";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { getCuisines, getRestaurants } from "@/lib/api";
import { RestaurantCard } from "@/components/restaurants/restaurant-card";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { UtensilsCrossed } from "lucide-react";

export const Route = createFileRoute("/restaurants/")({
  component: RestaurantsIndexPage,
});

function RestaurantsIndexPage() {
  const [selectedCuisine, setSelectedCuisine] = useState<string | undefined>(undefined);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const { data: cuisinesData } = useQuery({
    queryKey: ["cuisines"],
    queryFn: getCuisines,
    staleTime: 5 * 60 * 1000,
  });

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteQuery({
    queryKey: ["restaurants", selectedCuisine],
    queryFn: ({ pageParam }) => getRestaurants(pageParam, selectedCuisine),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.data.hasMore ? lastPage.data.page + 1 : undefined),
  });

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 },
    );

    const sentinel = sentinelRef.current;
    if (sentinel) observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const restaurants = data?.pages.flatMap((p) => p.data.restaurants) ?? [];
  const cuisines = cuisinesData?.data ?? [];

  return (
    <div className="container mx-auto px-4 md:px-8 py-8 flex flex-col h-full">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Restaurants</h1>
        <p className="text-muted-foreground mt-1">Discover and explore the best spots around you</p>
      </div>

      {cuisines.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedCuisine(undefined)}
            className={cn(
              "rounded-full shrink-0 border",
              !selectedCuisine
                ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90 hover:text-primary-foreground"
                : "border-border",
            )}
          >
            All
          </Button>
          {cuisines.map((cuisine) => (
            <Button
              key={cuisine}
              variant="ghost"
              size="sm"
              onClick={() => setSelectedCuisine(selectedCuisine === cuisine ? undefined : cuisine)}
              className={cn(
                "rounded-full shrink-0 border capitalize",
                selectedCuisine === cuisine
                  ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90 hover:text-primary-foreground"
                  : "border-border",
              )}
            >
              {cuisine}
            </Button>
          ))}
        </div>
      )}

      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border bg-card h-64 animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && restaurants.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground">
          <UtensilsCrossed className="size-10 opacity-40" />
          <p className="text-sm">
            {selectedCuisine
              ? `No restaurants found for "${selectedCuisine}"`
              : "No restaurants yet"}
          </p>
        </div>
      )}

      {restaurants.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {restaurants.map((restaurant) => (
            <RestaurantCard key={restaurant.id} restaurant={restaurant} />
          ))}
        </div>
      )}

      <div ref={sentinelRef} className="h-px mt-8" />
      {isFetchingNextPage && (
        <div className="flex justify-center py-6">
          <Spinner className="size-5 text-muted-foreground" />
        </div>
      )}
    </div>
  );
}
