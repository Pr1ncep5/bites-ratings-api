import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { RestaurantCreateSchema } from "@bites-ratings/shared";
import type { RestaurantCreate, RestaurantListItem } from "@bites-ratings/shared";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, X } from "lucide-react";

type RestaurantFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: RestaurantCreate) => void;
  isSubmitting: boolean;
  initialData?: RestaurantListItem | null;
};

export function RestaurantFormDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
  initialData,
}: RestaurantFormDialogProps) {
  const isEditing = Boolean(initialData);
  const [cuisineInput, setCuisineInput] = useState("");

  const form = useForm({
    defaultValues: {
      name: initialData?.name ?? "",
      location: initialData?.location ?? "",
      cuisines: initialData?.cuisines ?? ([] as string[]),
    },
    onSubmit: async ({ value }) => {
      onSubmit(value);
    },
  });

  const handleAddCuisine = (cuisinesField: {
    state: { value: string[] };
    handleChange: (value: string[]) => void;
  }) => {
    const trimmed = cuisineInput.trim();
    if (trimmed && !cuisinesField.state.value.includes(trimmed)) {
      cuisinesField.handleChange([...cuisinesField.state.value, trimmed]);
    }
    setCuisineInput("");
  };

  const handleRemoveCuisine = (
    cuisinesField: {
      state: { value: string[] };
      handleChange: (value: string[]) => void;
    },
    cuisine: string,
  ) => {
    cuisinesField.handleChange(cuisinesField.state.value.filter((c) => c !== cuisine));
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !isSubmitting) {
          form.reset();
          setCuisineInput("");
          onOpenChange(false);
        }
      }}
    >
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Restaurant" : "Add New Restaurant"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the restaurant's details below."
              : "Fill in the details to create a new restaurant."}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="space-y-5"
        >
          <form.Field
            name="name"
            validators={{
              onChange: RestaurantCreateSchema.shape.name,
            }}
          >
            {(field) => (
              <div className="space-y-2">
                <label htmlFor="restaurant-name" className="text-sm font-medium">
                  Name
                </label>
                <Input
                  id="restaurant-name"
                  placeholder="Restaurant name"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                {field.state.meta.errors.length > 0 && (
                  <p className="text-[0.8rem] font-medium text-destructive">
                    {field.state.meta.errors.join(", ")}
                  </p>
                )}
              </div>
            )}
          </form.Field>

          <form.Field
            name="location"
            validators={{
              onChange: RestaurantCreateSchema.shape.location,
            }}
          >
            {(field) => (
              <div className="space-y-2">
                <label htmlFor="restaurant-location" className="text-sm font-medium">
                  Location
                </label>
                <Input
                  id="restaurant-location"
                  placeholder="e.g. 13.405,52.52"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                {field.state.meta.errors.length > 0 && (
                  <p className="text-[0.8rem] font-medium text-destructive">
                    {field.state.meta.errors.join(", ")}
                  </p>
                )}
              </div>
            )}
          </form.Field>

          <form.Field
            name="cuisines"
            validators={{
              onChange: RestaurantCreateSchema.shape.cuisines,
            }}
          >
            {(field) => (
              <div className="space-y-2">
                <label htmlFor="restaurant-cuisines" className="text-sm font-medium">
                  Cuisines
                </label>
                <div className="flex gap-2">
                  <Input
                    id="restaurant-cuisines"
                    placeholder="Type a cuisine and press Enter"
                    value={cuisineInput}
                    onChange={(e) => setCuisineInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddCuisine(field);
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => handleAddCuisine(field)}
                  >
                    Add
                  </Button>
                </div>
                {field.state.value.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {field.state.value.map((cuisine) => (
                      <Badge key={cuisine} variant="secondary" className="gap-1 pr-1">
                        {cuisine}
                        <button
                          type="button"
                          onClick={() => handleRemoveCuisine(field, cuisine)}
                          className="ml-0.5 rounded-full hover:bg-destructive/20 p-0.5"
                        >
                          <X className="size-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
                {field.state.meta.errors.length > 0 && (
                  <p className="text-[0.8rem] font-medium text-destructive">
                    {field.state.meta.errors.join(", ")}
                  </p>
                )}
              </div>
            )}
          </form.Field>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <form.Subscribe selector={(state) => [state.canSubmit]}>
              {([canSubmit]) => (
                <Button type="submit" disabled={!canSubmit || isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
                  {isEditing ? "Save Changes" : "Create Restaurant"}
                </Button>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
