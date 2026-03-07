import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getUsersForAdmin, updateUserBan, updateUserRole } from "@/lib/api";
import { DataTable } from "@/components/ui/data-table";
import { getUsersColumns } from "./columns";
import { PageLoader } from "@/components/page-loader";
import { toast } from "sonner";
import { useMemo, useState } from "react";
import type { AdminUserListItem } from "@bites-ratings/shared";
import { Input } from "@/components/ui/input";
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

type Role = "admin" | "owner" | "user";
type PendingAction =
  | { type: "role"; user: AdminUserListItem; role: Role }
  | { type: "ban"; user: AdminUserListItem };

export function UsersTable() {
  const queryClient = useQueryClient();
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [banReason, setBanReason] = useState("");

  const {
    data: users,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: getUsersForAdmin,
  });

  const roleMutation = useMutation({
    mutationFn: updateUserRole,
    onSuccess: (_data, variables) => {
      toast.success(`Role updated to ${variables.role}.`);
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: (error) => toast.error(error.message || "Failed to update role."),
  });

  const banMutation = useMutation({
    mutationFn: updateUserBan,
    onSuccess: () => {
      toast.success("User ban status updated.");
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: (error) => toast.error(error.message || "Failed to update ban status."),
  });

  const handleRoleChangeRequest = (user: AdminUserListItem, role: Role) => {
    setPendingAction({ type: "role", user, role });
  };

  const handleBanToggleRequest = (user: AdminUserListItem) => {
    setBanReason("");
    setPendingAction({ type: "ban", user });
  };

  const handleConfirmAction = () => {
    if (!pendingAction) {
      return;
    }

    if (pendingAction.type === "role") {
      roleMutation.mutate(
        { id: pendingAction.user.id, role: pendingAction.role },
        {
          onSuccess: () => {
            setPendingAction(null);
          },
        },
      );
      return;
    }

    const nextBanned = !Boolean(pendingAction.user.banned);
    banMutation.mutate(
      {
        id: pendingAction.user.id,
        banned: nextBanned,
        banReason: nextBanned ? banReason.trim() || undefined : undefined,
      },
      {
        onSuccess: () => {
          setPendingAction(null);
          setBanReason("");
        },
      },
    );
  };

  const columns = useMemo(
    () =>
      getUsersColumns({
        onRequestRoleChange: handleRoleChangeRequest,
        onRequestBanToggle: handleBanToggleRequest,
        roleUpdatingUserId: roleMutation.isPending ? roleMutation.variables?.id : undefined,
        banUpdatingUserId: banMutation.isPending ? banMutation.variables?.id : undefined,
      }),
    [roleMutation.isPending, roleMutation.variables, banMutation.isPending, banMutation.variables],
  );

  if (isLoading) {
    return <PageLoader />;
  }

  if (isError) {
    return <div className="text-red-500">Failed to load users.</div>;
  }

  const isSubmitting = roleMutation.isPending || banMutation.isPending;
  const dialogOpen = Boolean(pendingAction);
  const isRoleAction = pendingAction?.type === "role";
  const roleTarget = isRoleAction ? pendingAction.role : null;
  const isAdminRoleChange = isRoleAction && roleTarget === "admin";
  const isBanAction = pendingAction?.type === "ban";
  const willBan = isBanAction ? !Boolean(pendingAction.user.banned) : false;

  return (
    <>
      <DataTable columns={columns} data={users?.data || []} searchPlaceholder="Search users..." />
      <AlertDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open && !isSubmitting) {
            setPendingAction(null);
            setBanReason("");
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isRoleAction
                ? `Change role to ${roleTarget}`
                : willBan
                  ? "Ban this user?"
                  : "Unban this user?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isRoleAction
                ? isAdminRoleChange
                  ? "This grants full admin privileges. Please confirm this sensitive action."
                  : "This will update the user's role immediately."
                : willBan
                  ? "This user will lose access based on your backend auth checks."
                  : "This will restore the user's access."}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {isBanAction && willBan && (
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="ban-reason">
                Ban reason (optional)
              </label>
              <Input
                id="ban-reason"
                value={banReason}
                onChange={(event) => setBanReason(event.target.value)}
                placeholder="Reason shown to admins"
              />
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmAction}
              disabled={isSubmitting}
              variant={isBanAction && willBan ? "destructive" : "default"}
            >
              {isSubmitting ? "Processing..." : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
