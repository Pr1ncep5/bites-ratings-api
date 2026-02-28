import { Eye, MapPin, Star, StarHalf, Utensils } from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { RestaurantListItem } from "@bites-ratings/shared";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

function StarRating({ value }: { value: number }) {
  const stars = [];
  const full = Math.floor(value);
  const hasHalf = value - full >= 0.5;

  for (let i = 0; i < 5; i++) {
    if (i < full) {
      stars.push(<Star key={i} className="size-3.5 fill-amber-400 stroke-amber-400" />);
    } else if (i === full && hasHalf) {
      stars.push(<StarHalf key={i} className="size-3.5 fill-amber-400 stroke-amber-400" />);
    } else {
      stars.push(<Star key={i} className="size-3.5 stroke-muted-foreground/50" />);
    }
  }

  return (
    <div className="flex items-center gap-0.5" aria-hidden="true" title={`${value} out of 5 stars`}>
      {stars}
    </div>
  );
}

export function RestaurantCard({ restaurant }: { restaurant: RestaurantListItem }) {
  const avgStars = restaurant.avgStars;
  const viewCount = restaurant.viewCount;

  return (
    <Card
      className={cn(
        "group relative flex h-full flex-col overflow-hidden transition-all duration-200",
        "hover:shadow-md hover:border-primary/30 focus-within:border-primary/30 focus-within:ring-2 focus-within:ring-ring",
      )}
    >
      <div className="flex h-32 w-full items-center justify-center bg-muted/50">
        <Utensils className="size-8 text-muted-foreground/30" />
      </div>

      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base leading-tight line-clamp-2 transition-colors group-hover:text-primary">
            <Link
              to="/restaurants/$restaurantId"
              params={{ restaurantId: restaurant.id }}
              className="after:absolute after:inset-0 focus:outline-none"
            >
              {restaurant.name}
            </Link>
          </CardTitle>
          <div className="flex shrink-0 items-center gap-1 text-sm font-semibold tabular-nums text-foreground">
            {avgStars > 0 ? avgStars.toFixed(1) : "—"}
          </div>
        </div>
        <CardDescription className="flex items-center gap-1 mt-1">
          <MapPin className="size-3 shrink-0" />
          <span className="truncate">{restaurant.location}</span>
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 pb-2">
        <StarRating value={avgStars} />
      </CardContent>

      <CardFooter className="flex flex-col items-start gap-3 pt-0">
        {restaurant.cuisines.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {restaurant.cuisines.map((cuisine) => (
              <Badge key={cuisine} variant="secondary" className="text-xs">
                {cuisine}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Eye className="size-3" />
          <span>{viewCount.toLocaleString()} views</span>
        </div>
      </CardFooter>
    </Card>
  );
}
