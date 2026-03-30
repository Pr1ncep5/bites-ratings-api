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
import { geocodeAddress } from "@/lib/geocoding";
import { Loader2, LocateFixed, X } from "lucide-react";

type RestaurantFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: RestaurantCreate) => void;
  isSubmitting: boolean;
  initialData?: RestaurantListItem | null;
  serverError?: string | null;
};

export function RestaurantFormDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
  initialData,
  serverError,
}: RestaurantFormDialogProps) {
  const isEditing = Boolean(initialData);
  const [cuisineInput, setCuisineInput] = useState("");
  const [isResolvingAddress, setIsResolvingAddress] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);
  const [isAddressResolved, setIsAddressResolved] = useState(Boolean(initialData));

  const form = useForm({
    defaultValues: {
      name: initialData?.name ?? "",
      address: initialData?.address ?? "",
      latitude: initialData?.latitude ?? 0,
      longitude: initialData?.longitude ?? 0,
      cuisines: initialData?.cuisines ?? ([] as string[]),
    },
    onSubmit: async ({ value }) => {
      if (!isAddressResolved) {
        setResolveError("Please click Resolve to convert the address to coordinates.");
        return;
      }
      onSubmit(value);
    },
  });

  const handleResolveAddress = async () => {
    const address = form.state.values.address.trim();
    if (!address) {
      setResolveError("Please enter an address first.");
      return;
    }

    setIsResolvingAddress(true);
    setResolveError(null);
    try {
      const resolved = await geocodeAddress(address);
      if (!resolved) {
        setIsAddressResolved(false);
        setResolveError("Could not resolve this address. Try a more specific one.");
        return;
      }

      form.setFieldValue("address", resolved.address);
      form.setFieldValue("latitude", Number(resolved.latitude.toFixed(6)));
      form.setFieldValue("longitude", Number(resolved.longitude.toFixed(6)));
      setIsAddressResolved(true);
    } finally {
      setIsResolvingAddress(false);
    }
  };

  const handleAddCuisine = (cuisinesField: any) => {
    const incoming = cuisineInput
      .split(",")
      .map((value) => {
        const trimmed = value.trim();
        return trimmed ? trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase() : "";
      })
      .filter(Boolean);

    const existing = new Set(cuisinesField.state.value.map((v: string) => v.toLowerCase()));
    const unique = incoming.filter((v) => !existing.has(v.toLowerCase()));

    if (unique.length > 0) {
      cuisinesField.handleChange([...cuisinesField.state.value, ...unique]);
    }
    setCuisineInput("");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !isSubmitting) {
          form.reset();
          setCuisineInput("");
          setResolveError(null);
          setIsAddressResolved(Boolean(initialData));
          onOpenChange(false);
        }
      }}
    >
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Restaurant" : "Add New Restaurant"}</DialogTitle>
          <DialogDescription>Enter the restaurant details below.</DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
          className="space-y-5"
        >
          {/* Name Field */}
          <form.Field name="name" validators={{ onChange: RestaurantCreateSchema.shape.name }}>
            {(field) => (
              <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>
                <Input
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Pizza Palace"
                />
              </div>
            )}
          </form.Field>

          {/* Address Field */}
          <form.Field
            name="address"
            validators={{ onChange: RestaurantCreateSchema.shape.address }}
          >
            {(field) => (
              <div className="space-y-2">
                <label className="text-sm font-medium">Address</label>
                <div className="flex gap-2">
                  <Input
                    value={field.state.value}
                    onChange={(e) => {
                      field.handleChange(e.target.value);
                      setIsAddressResolved(false);
                      setResolveError(null);
                      form.setFieldValue("latitude", 0);
                      form.setFieldValue("longitude", 0);
                    }}
                    placeholder="Type full address, then click Resolve"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleResolveAddress}
                    disabled={isResolvingAddress}
                  >
                    {isResolvingAddress ? (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    ) : (
                      <LocateFixed className="mr-2 size-4" />
                    )}
                    Resolve
                  </Button>
                </div>
                {field.state.meta.errors.length > 0 && (
                  <p className="text-xs text-destructive">{field.state.meta.errors.join(", ")}</p>
                )}
              </div>
            )}
          </form.Field>

          {/* Hidden/Read-only Coordinates Display (Optional for UX) */}
          <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
            <div>Lat: {form.state.values.latitude || "---"}</div>
            <div>Lng: {form.state.values.longitude || "---"}</div>
          </div>
          {resolveError ? <p className="text-xs text-destructive">{resolveError}</p> : null}

          {/* Cuisines Field */}
          <form.Field name="cuisines">
            {(field) => (
              <div className="space-y-2">
                <label className="text-sm font-medium">Cuisines</label>
                <div className="flex gap-2">
                  <Input
                    value={cuisineInput}
                    onChange={(e) => setCuisineInput(e.target.value)}
                    placeholder="Italian, Pizza..."
                    onKeyDown={(e) =>
                      e.key === "Enter" && (e.preventDefault(), handleAddCuisine(field))
                    }
                  />
                  <Button type="button" onClick={() => handleAddCuisine(field)}>
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {field.state.value.map((c: string) => (
                    <Badge key={c} variant="secondary" className="gap-1">
                      {c}
                      <X
                        className="size-3 cursor-pointer"
                        onClick={() =>
                          field.handleChange(field.state.value.filter((i: string) => i !== c))
                        }
                      />
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </form.Field>

          <DialogFooter>
            {serverError && <p className="text-sm text-destructive">{serverError}</p>}
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
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
