import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Phone, Globe, CloudSun, Star } from "lucide-react";
import { getRestaurant, getRestaurantDetails, getRestaurantWeather } from "@/lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageLoader } from "@/components/page-loader";
import { ReviewForm } from "@/components/reviews/review-form";
import { ReviewFeed } from "@/components/reviews/review-feed";

export const Route = createFileRoute("/restaurants/$restaurantId")({
  component: RestaurantDetailPage,
});

function RestaurantDetailPage() {
  const { restaurantId } = Route.useParams();

  const { data: restaurantRes, isLoading: isCoreLoading } = useQuery({
    queryKey: ["restaurant", restaurantId],
    queryFn: () => getRestaurant(restaurantId),
  });

  const { data: detailsRes } = useQuery({
    queryKey: ["restaurantDetails", restaurantId],
    queryFn: () => getRestaurantDetails(restaurantId),
  });

  const { data: weatherRes } = useQuery({
    queryKey: ["restaurantWeather", restaurantId],
    queryFn: () => getRestaurantWeather(restaurantId),
  });

  const restaurant = restaurantRes?.data;
  const details = detailsRes?.data;
  const weather = weatherRes?.data;

  if (isCoreLoading) {
    return <PageLoader />;
  }

  if (!restaurant) {
    return <div className="p-8 text-center text-muted-foreground">Restaurant not found.</div>;
  }

  return (
    <div className="container mx-auto px-4 md:px-8 py-8 flex flex-col gap-8 max-w-5xl">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 border-b pb-8">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight mb-2">{restaurant.name}</h1>
          <div className="flex items-center gap-4 text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Star className="size-5 fill-amber-400 stroke-amber-400" />
              <span className="font-bold text-foreground text-lg">
                {(restaurant.avgStars ?? 0).toFixed(1)}
              </span>
              <span className="text-sm">({restaurant.viewCount} views)</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm">
              <MapPin className="size-4" />
              <span>{restaurant.location}</span>
            </div>
          </div>

          {restaurant.cuisines?.length > 0 && (
            <div className="flex gap-2 mt-4">
              {restaurant.cuisines.map((cuisine) => (
                <Badge key={cuisine} variant="secondary">
                  {cuisine}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-6 w-full justify-start border-b rounded-none bg-transparent h-auto p-0">
          <TabsTrigger
            value="overview"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="reviews"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
          >
            Reviews
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <h2 className="text-2xl font-bold">About</h2>
            <p className="text-muted-foreground">
              A fantastic {restaurant.cuisines[0]?.toLowerCase() || "local"} dining experience
              located at coordinates {restaurant.location}.
            </p>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contact Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {details?.contacts?.phone && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="size-4 text-muted-foreground" />
                    <span>{details.contacts.phone}</span>
                  </div>
                )}
                {details?.links &&
                  details.links.map((link) => (
                    <div key={link.url} className="flex items-center gap-3 text-sm">
                      <Globe className="size-4 text-muted-foreground" />
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline"
                      >
                        {link.name}
                      </a>
                    </div>
                  ))}
                {!details && (
                  <p className="text-sm text-muted-foreground">No contact info available.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CloudSun className="size-5" /> Current Weather
                </CardTitle>
              </CardHeader>
              <CardContent>
                {weather ? (
                  <div className="flex items-center gap-4">
                    <div className="text-3xl font-bold">{Math.round(weather.main.temp)}°C</div>
                    <div className="text-sm text-muted-foreground capitalize">
                      {weather.weather[0]?.description}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Weather unavailable.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reviews" className="space-y-8">
          <ReviewForm restaurantId={restaurantId} />

          <ReviewFeed restaurantId={restaurantId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
