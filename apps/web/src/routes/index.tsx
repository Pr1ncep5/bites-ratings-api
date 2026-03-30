import { useState } from "react";
import type { SyntheticEvent } from "react";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { geocodeAddress } from "@/lib/geocoding";
import { Loader2, LocateFixed, Search } from "lucide-react";

export const Route = createFileRoute("/")({
  beforeLoad: async ({ context }) => {
    if (!context.auth.session) {
      throw redirect({ to: "/login" });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const [address, setAddress] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const goToRestaurants = (payload: {
    address?: string;
    latitude?: number;
    longitude?: number;
  }) => {
    navigate({
      to: "/restaurants",
      search: {
        address: payload.address,
        latitude: payload.latitude,
        longitude: payload.longitude,
        radiusKm: payload.latitude && payload.longitude ? 5 : undefined,
      },
    });
  };

  const handleSubmit = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedAddress = address.trim();
    if (!trimmedAddress) {
      setError("Please enter your address.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const result = await geocodeAddress(trimmedAddress);
      if (!result) {
        setError("Could not resolve that address. Try a more specific one.");
        return;
      }

      goToRestaurants(result);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        goToRestaurants({
          address: "Current location",
          latitude: Number(position.coords.latitude.toFixed(6)),
          longitude: Number(position.coords.longitude.toFixed(6)),
        });
      },
      () => {
        setError("Could not access your location. Check browser permissions.");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  return (
    <div className="container mx-auto flex flex-1 flex-col justify-center px-4 py-12 md:px-8">
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Order delivery near you</h1>
        <p className="text-muted-foreground">
          Enter your delivery address to find nearby restaurants using Redis GEO search.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 md:flex-row">
          <Input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Enter delivery address"
            className="h-11"
          />
          <Button type="submit" className="h-11" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Search className="mr-2 size-4" />}
            Find Food
          </Button>
          <Button type="button" variant="outline" className="h-11" onClick={handleUseMyLocation}>
            <LocateFixed className="mr-2 size-4" />
            Use my location
          </Button>
        </form>

        {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}
      </div>
    </div>
  );
}
