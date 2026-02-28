import z from "zod";

export const ReviewCreateSchema = z.object({
    review: z.string().min(1),
    rating: z.number().min(1).max(5),
});

export const ReviewResponseSchema = z.object({
    id: z.string(),
    review: z.string(),
    rating: z.coerce.number(),
    timestamp: z.coerce.number(),
    restaurantId: z.string(),
    authorId: z.string(),
});

export type ReviewCreate = z.infer<typeof ReviewCreateSchema>;
export type ReviewListItem = z.infer<typeof ReviewResponseSchema>;

export type PaginatedReviews = {
    reviews: ReviewListItem[];
    hasMore: boolean;
    page: number;
};