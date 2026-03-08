import { createFileRoute } from "@tanstack/react-router";
import { RestaurantsTable } from "@/components/admin/restaurants/restaurants-table";

export const Route = createFileRoute("/admin/restaurants")({
  component: AdminRestaurantsPage,
});

function AdminRestaurantsPage() {
  return (
    <div className="p-8 space-y-4">
      <h1 className="text-3xl font-bold tracking-tight">Restaurant Management</h1>
      <RestaurantsTable />
    </div>
  );
}
