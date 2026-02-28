import { Eye, MapPin, Star, StarHalf, Utensils } from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { RestaurantListItem } from "@bites-ratings/shared";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
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
      stars.push(<Star key={i} className="size-4 fill-amber-400 stroke-amber-400" />);
    } else if (i === full && hasHalf) {
      stars.push(<StarHalf key={i} className="size-4 fill-amber-400 stroke-amber-400" />);
    } else {
      stars.push(<Star key={i} className="size-4 stroke-muted-foreground/30" />);
    }
  }

  return (
    <div className="flex items-center gap-0.5" aria-hidden="true">
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
        "hover:shadow-md hover:border-primary/50 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-ring",
      )}
    >
      <div className="flex h-28 w-full items-center justify-center bg-muted/40 border-b">
        <Utensils className="size-6 text-muted-foreground/30" />
      </div>

      <CardHeader className="pb-3 pt-4">
        <CardTitle className="text-lg leading-tight line-clamp-1 transition-colors group-hover:text-primary">
          <Link
            to="/restaurants/$restaurantId"
            params={{ restaurantId: restaurant.id }}
            className="after:absolute after:inset-0 focus:outline-none"
          >
            {restaurant.name}
          </Link>
        </CardTitle>

        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-sm font-bold tabular-nums text-foreground">
            {avgStars > 0 ? avgStars.toFixed(1) : "New"}
          </span>
          {avgStars > 0 && <StarRating value={avgStars} />}
        </div>
      </CardHeader>

      <CardContent className="flex-1 pb-4">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="size-3.5 shrink-0" />
          <span className="truncate">Coordinates: {restaurant.location}</span>
        </div>
      </CardContent>

      <CardFooter className="flex items-center justify-between pt-0 pb-4 border-t bg-muted/10 px-6 pt-4 mt-auto">
        <div className="flex flex-wrap gap-1.5">
          {restaurant.cuisines.slice(0, 2).map((cuisine) => (
            <Badge
              key={cuisine}
              variant="outline"
              className="text-[10px] uppercase tracking-wider bg-background"
            >
              {cuisine}
            </Badge>
          ))}
          {restaurant.cuisines.length > 2 && (
            <Badge variant="outline" className="text-[10px] bg-background">
              +{restaurant.cuisines.length - 2}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
          <Eye className="size-3.5" />
          <span>{viewCount.toLocaleString()}</span>
        </div>
      </CardFooter>
    </Card>
  );
}
