import { UsersTable } from "@/components/admin/users/users-table";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/users")({
  component: AdminUsersPage,
});

function AdminUsersPage() {
  return (
    <div className="p-8 space-y-4">
      <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
      <UsersTable />
    </div>
  );
}
