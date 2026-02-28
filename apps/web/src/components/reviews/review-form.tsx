import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ReviewCreateSchema } from "@bites-ratings/shared";
import { createReview } from "@/lib/api";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

type StarRatingInputProps = {
  value: number;
  onChange: (value: number) => void;
};

export function StarRatingInput({ value, onChange }: StarRatingInputProps) {
  const [hoverValue, setHoverValue] = useState(0);

  return (
    <div className="flex items-center gap-1" onMouseLeave={() => setHoverValue(0)}>
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = star <= (hoverValue || value);
        return (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHoverValue(star)}
            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm transition-transform hover:scale-110"
          >
            <Star
              className={cn(
                "size-8 transition-colors",
                isFilled
                  ? "fill-amber-400 stroke-amber-400"
                  : "stroke-muted-foreground/30 hover:stroke-amber-400/50",
              )}
            />
          </button>
        );
      })}
    </div>
  );
}

export function ReviewForm({ restaurantId }: { restaurantId: string }) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: createReview,
    onSuccess: () => {
      toast.success("Review published!");
      queryClient.invalidateQueries({ queryKey: ["reviews", restaurantId] });
      queryClient.invalidateQueries({ queryKey: ["restaurant", restaurantId] });
      form.reset();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to submit review.");
    },
  });

  const form = useForm({
    defaultValues: {
      rating: 0,
      review: "",
    },
    onSubmit: async ({ value }) => {
      mutation.mutate({ restaurantId, data: value });
    },
  });

  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
      <h3 className="text-lg font-semibold mb-4">Write a Review</h3>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        className="space-y-6"
      >
        <form.Field
          name="rating"
          validators={{
            onChange: ReviewCreateSchema.shape.rating,
          }}
        >
          {(field) => (
            <div className="space-y-2">
              <StarRatingInput value={field.state.value} onChange={field.handleChange} />
              {field.state.meta.errors ? (
                <p className="text-[0.8rem] font-medium text-destructive">
                  {field.state.meta.errors.join(", ")}
                </p>
              ) : null}
            </div>
          )}
        </form.Field>

        <form.Field
          name="review"
          validators={{
            onChange: ReviewCreateSchema.shape.review,
          }}
        >
          {(field) => (
            <div className="space-y-2">
              <Textarea
                placeholder="What did you think about the food and service?"
                className="resize-none min-h-[100px]"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              {field.state.meta.errors ? (
                <p className="text-[0.8rem] font-medium text-destructive">
                  {field.state.meta.errors.join(", ")}
                </p>
              ) : null}
            </div>
          )}
        </form.Field>

        <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
          {([canSubmit, isSubmitting]) => (
            <Button
              type="submit"
              disabled={!canSubmit || isSubmitting || mutation.isPending}
              className="w-full sm:w-auto"
            >
              {(isSubmitting || mutation.isPending) && (
                <Loader2 className="mr-2 size-4 animate-spin" />
              )}
              Post Review
            </Button>
          )}
        </form.Subscribe>
      </form>
    </div>
  );
}
