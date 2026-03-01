import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboardPage,
});

function AdminDashboardPage() {
  return (
    <div className="p-8 space-y-4">
      <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
      <p>Welcome to the command center. High-level metrics coming soon.</p>
    </div>
  );
}
