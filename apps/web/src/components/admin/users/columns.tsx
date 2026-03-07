"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { AdminUserListItem } from "@bites-ratings/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type Role = "admin" | "owner" | "user";

type UsersTableColumnActions = {
  onRequestRoleChange: (user: AdminUserListItem, role: Role) => void;
  onRequestBanToggle: (user: AdminUserListItem) => void;
  roleUpdatingUserId?: string;
  banUpdatingUserId?: string;
};

function SortableHeader({
  label,
  column,
}: {
  label: string;
  column: { getIsSorted: () => false | "asc" | "desc"; toggleSorting: (desc?: boolean) => void };
}) {
  const sorted = column.getIsSorted();
  const Icon = sorted === "asc" ? ArrowUp : sorted === "desc" ? ArrowDown : ArrowUpDown;

  return (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting(sorted === "asc")}
      className="text-primary h-8 px-1 text-xs font-semibold tracking-wide uppercase hover:bg-transparent"
    >
      {label}
      <Icon className="ml-1 size-4" />
    </Button>
  );
}

export function getUsersColumns({
  onRequestRoleChange,
  onRequestBanToggle,
  roleUpdatingUserId,
  banUpdatingUserId,
}: UsersTableColumnActions): ColumnDef<AdminUserListItem>[] {
  const formatDate = (value: unknown) => {
    const date = new Date(value as string | number | Date);
    if (Number.isNaN(date.getTime())) {
      return "Invalid date";
    }
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear();
    return `${dd}.${mm}.${yyyy}`;
  };

  return [
    {
      accessorKey: "name",
      header: ({ column }) => <SortableHeader label="Name" column={column} />,
    },
    {
      accessorKey: "email",
      header: ({ column }) => <SortableHeader label="Email" column={column} />,
    },
    {
      accessorKey: "role",
      header: ({ column }) => <SortableHeader label="Role" column={column} />,
      cell: ({ row }) => {
        const role = (row.getValue("role") as string) || "user";
        return (
          <Badge variant={role === "admin" ? "default" : "secondary"} className="capitalize">
            {role}
          </Badge>
        );
      },
    },
    {
      accessorKey: "banned",
      header: ({ column }) => <SortableHeader label="Status" column={column} />,
      cell: ({ row }) => {
        const isBanned = Boolean(row.getValue("banned"));
        return (
          <Badge variant={isBanned ? "destructive" : "default"}>
            {isBanned ? "Banned" : "Active"}
          </Badge>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => <SortableHeader label="Joined" column={column} />,
      cell: ({ row }) => {
        return <span>{formatDate(row.getValue("createdAt"))}</span>;
      },
    },
    {
      id: "actions",
      header: () => (
        <span className="text-primary text-xs font-semibold tracking-wide uppercase">Actions</span>
      ),
      cell: ({ row }) => {
        const user = row.original;
        const role = user.role || "user";
        const isBanned = Boolean(user.banned);
        const isBanUpdating = banUpdatingUserId === user.id;
        const isRoleUpdating = roleUpdatingUserId === user.id;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="size-8 p-0">
                <span className="sr-only">Open user menu</span>
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(user.id)}
                className="cursor-pointer"
              >
                Copy User ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuSub>
                <DropdownMenuSubTrigger disabled={isRoleUpdating}>
                  Change role
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem
                    className="cursor-pointer"
                    disabled={role === "admin" || isRoleUpdating}
                    onClick={() => onRequestRoleChange(user, "admin")}
                  >
                    Set as Admin
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer"
                    disabled={role === "owner" || isRoleUpdating}
                    onClick={() => onRequestRoleChange(user, "owner")}
                  >
                    Set as Owner
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer"
                    disabled={role === "user" || isRoleUpdating}
                    onClick={() => onRequestRoleChange(user, "user")}
                  >
                    Set as User
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuItem
                className={cn("cursor-pointer", isBanned ? "text-green-600" : "text-red-600")}
                disabled={isBanUpdating}
                onClick={() => onRequestBanToggle(user)}
              >
                {isBanned ? "Unban User" : "Ban User"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
