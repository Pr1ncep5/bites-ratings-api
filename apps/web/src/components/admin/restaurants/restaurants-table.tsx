import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getRestaurantsForAdmin,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant,
} from "@/lib/api";
import { DataTable } from "@/components/ui/data-table";
import { getRestaurantColumns } from "./columns";
import { RestaurantFormDialog } from "./restaurant-form-dialog";
import { PageLoader } from "@/components/page-loader";
import { toast } from "sonner";
import { useMemo, useState } from "react";
import type { RestaurantListItem, RestaurantCreate } from "@bites-ratings/shared";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function RestaurantsTable() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState<RestaurantListItem | null>(null);
  const [deletingRestaurant, setDeletingRestaurant] = useState<RestaurantListItem | null>(null);

  const {
    data: restaurants,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["admin", "restaurants"],
    queryFn: getRestaurantsForAdmin,
  });

  const createMutation = useMutation({
    mutationFn: createRestaurant,
    onSuccess: () => {
      toast.success("Restaurant created successfully.");
      queryClient.invalidateQueries({ queryKey: ["admin", "restaurants"] });
      setIsCreateOpen(false);
    },
    onError: (error) => toast.error(error.message || "Failed to create restaurant."),
  });

  const updateMutation = useMutation({
    mutationFn: updateRestaurant,
    onSuccess: () => {
      toast.success("Restaurant updated successfully.");
      queryClient.invalidateQueries({ queryKey: ["admin", "restaurants"] });
      setEditingRestaurant(null);
    },
    onError: (error) => toast.error(error.message || "Failed to update restaurant."),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteRestaurant,
    onSuccess: () => {
      toast.success("Restaurant deleted successfully.");
      queryClient.invalidateQueries({ queryKey: ["admin", "restaurants"] });
      setDeletingRestaurant(null);
    },
    onError: (error) => toast.error(error.message || "Failed to delete restaurant."),
  });

  const handleCreate = (data: RestaurantCreate) => {
    createMutation.mutate(data);
  };

  const handleUpdate = (data: RestaurantCreate) => {
    if (!editingRestaurant) return;
    updateMutation.mutate({ id: editingRestaurant.id, data });
  };

  const handleConfirmDelete = () => {
    if (!deletingRestaurant) return;
    deleteMutation.mutate(deletingRestaurant.id);
  };

  const columns = useMemo(
    () =>
      getRestaurantColumns({
        onEdit: (restaurant) => setEditingRestaurant(restaurant),
        onDelete: (restaurant) => setDeletingRestaurant(restaurant),
      }),
    [],
  );

  if (isLoading) {
    return <PageLoader />;
  }

  if (isError) {
    return <div className="text-red-500">Failed to load restaurants.</div>;
  }

  const isDeleteSubmitting = deleteMutation.isPending;

  return (
    <>
      <div className="flex items-center justify-end pb-4">
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 size-4" />
          Add Restaurant
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={restaurants?.data || []}
        searchPlaceholder="Search restaurants..."
      />

      <RestaurantFormDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSubmit={handleCreate}
        isSubmitting={createMutation.isPending}
      />

      <RestaurantFormDialog
        key={editingRestaurant?.id ?? "create"}
        open={Boolean(editingRestaurant)}
        onOpenChange={(open) => {
          if (!open) setEditingRestaurant(null);
        }}
        onSubmit={handleUpdate}
        isSubmitting={updateMutation.isPending}
        initialData={editingRestaurant}
      />

      <AlertDialog
        open={Boolean(deletingRestaurant)}
        onOpenChange={(open) => {
          if (!open && !isDeleteSubmitting) {
            setDeletingRestaurant(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete restaurant?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold">{deletingRestaurant?.name}</span>? This will
              permanently remove the restaurant and all its reviews. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleteSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleteSubmitting}
              variant="destructive"
            >
              {isDeleteSubmitting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
