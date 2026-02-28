import { Star } from "lucide-react";
import { type ReviewListItem } from "@bites-ratings/shared";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PageLoader } from "../page-loader";
import { useEffect } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import { getReviews } from "@/lib/api";
import { Spinner } from "@/components/ui/spinner";
import { MessageSquareOff } from "lucide-react";

export function ReviewCard({ review }: { review: ReviewListItem }) {
  const date = new Date(review.timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex flex-col">
          <span className="text-sm font-semibold">User: {review.authorId.slice(0, 8)}...</span>
          <span className="text-xs text-muted-foreground">{date}</span>
        </div>
        <div className="flex items-center gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`size-4 ${
                i < review.rating ? "fill-amber-400 stroke-amber-400" : "stroke-muted-foreground/30"
              }`}
            />
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-foreground leading-relaxed">{review.review}</p>
      </CardContent>
    </Card>
  );
}

export function ReviewFeed({ restaurantId }: { restaurantId: string }) {
  const { ref, inView } = useInView({ threshold: 0.1 });

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteQuery({
    queryKey: ["reviews", restaurantId],
    queryFn: ({ pageParam }) => getReviews(restaurantId, pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.data.hasMore ? lastPage.data.page + 1 : undefined),
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const reviews = data?.pages.flatMap((page) => page.data.reviews) ?? [];

  if (isLoading) {
    return <PageLoader />;
  }

  if (reviews.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border rounded-xl border-dashed">
        <MessageSquareOff className="size-10 opacity-40 mb-3" />
        <p>No reviews yet. Be the first!</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 mt-8">
      <h3 className="text-lg font-semibold">Recent Reviews ({reviews.length})</h3>

      {reviews.map((review) => (
        <ReviewCard key={review.id} review={review} />
      ))}

      <div ref={ref} className="h-1" />

      {isFetchingNextPage && (
        <div className="flex justify-center py-4">
          <Spinner className="size-5 text-muted-foreground" />
        </div>
      )}
    </div>
  );
}
