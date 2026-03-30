import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Star } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { searchRestaurants } from "@/lib/api";

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const { data, isLoading } = useQuery({
    queryKey: ["search", debouncedQuery],
    queryFn: () => searchRestaurants(debouncedQuery),
    enabled: debouncedQuery.length > 1,
  });

  const restaurants = data?.data || [];

  const handleSelect = (id: string) => {
    setOpen(false);
    navigate({ to: "/restaurants/$restaurantId", params: { restaurantId: id } });
  };

  return (
    <>
      <Button
        variant="outline"
        className="relative h-9 w-full justify-start rounded-[0.5rem] bg-muted/50 text-sm font-normal text-muted-foreground shadow-none sm:pr-12 md:w-40 lg:w-64"
        onClick={() => setOpen(true)}
      >
        <span className="hidden lg:inline-flex">Search Bites...</span>
        <span className="inline-flex lg:hidden">Search...</span>
        <kbd className="pointer-events-none absolute right-[0.3rem] top-[0.3rem] hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Type a restaurant name..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          <CommandEmpty>
            {debouncedQuery.length === 0
              ? "Type a name to search..."
              : debouncedQuery.length === 1
                ? "Keep typing to search..."
                : isLoading
                  ? "Searching database..."
                  : "No restaurants found."}
          </CommandEmpty>

          {restaurants.length > 0 && (
            <CommandGroup heading="Restaurants">
              {restaurants.map((restaurant) => (
                <CommandItem
                  key={restaurant.id}
                  value={`${restaurant.name} ${restaurant.id}`}
                  onSelect={() => handleSelect(restaurant.id)}
                  className="cursor-pointer flex items-center justify-between py-3"
                >
                  <div className="flex flex-col gap-1">
                    <span className="font-medium text-base">{restaurant.name}</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="size-3" /> {restaurant.address}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 font-medium">
                    <Star className="size-4 fill-amber-400 stroke-amber-400" />
                    {(restaurant.avgStars ?? 0).toFixed(1)}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
