"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { RestaurantListItem } from "@bites-ratings/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, ArrowDown, ArrowUp, ArrowUpDown, Star } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type RestaurantColumnActions = {
  onEdit: (restaurant: RestaurantListItem) => void;
  onDelete: (restaurant: RestaurantListItem) => void;
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

export function getRestaurantColumns({
  onEdit,
  onDelete,
}: RestaurantColumnActions): ColumnDef<RestaurantListItem>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => <SortableHeader label="Name" column={column} />,
      cell: ({ row }) => <span className="font-medium">{row.getValue("name")}</span>,
    },
    {
      accessorKey: "location",
      header: ({ column }) => <SortableHeader label="Location" column={column} />,
    },
    {
      accessorKey: "cuisines",
      header: () => (
        <span className="text-primary text-xs font-semibold tracking-wide uppercase">Cuisines</span>
      ),
      cell: ({ row }) => {
        const cuisines = row.getValue("cuisines") as string[];
        return (
          <div className="flex flex-wrap gap-1">
            {cuisines.length > 0 ? (
              cuisines.map((c) => (
                <Badge key={c} variant="secondary" className="text-xs">
                  {c}
                </Badge>
              ))
            ) : (
              <span className="text-muted-foreground text-sm">—</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "avgStars",
      header: ({ column }) => <SortableHeader label="Rating" column={column} />,
      cell: ({ row }) => {
        const avg = row.getValue("avgStars") as number;
        return (
          <div className="flex items-center gap-1">
            <Star className="size-4 fill-amber-400 stroke-amber-400" />
            <span className="font-medium">{avg.toFixed(1)}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "viewCount",
      header: ({ column }) => <SortableHeader label="Views" column={column} />,
      cell: ({ row }) => {
        const views = row.getValue("viewCount") as number;
        return <span>{views.toLocaleString()}</span>;
      },
    },
    {
      accessorKey: "ownerId",
      header: ({ column }) => <SortableHeader label="Owner" column={column} />,
      cell: ({ row }) => {
        const ownerId = row.getValue("ownerId") as string | null;
        return ownerId ? (
          <span className="font-mono text-xs">{ownerId.slice(0, 8)}…</span>
        ) : (
          <Badge variant="outline">Unclaimed</Badge>
        );
      },
    },
    {
      id: "actions",
      header: () => (
        <span className="text-primary text-xs font-semibold tracking-wide uppercase">Actions</span>
      ),
      cell: ({ row }) => {
        const restaurant = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="size-8 p-0">
                <span className="sr-only">Open restaurant menu</span>
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(restaurant.id)}
                className="cursor-pointer"
              >
                Copy ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer" onClick={() => onEdit(restaurant)}>
                Edit Details
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer text-red-600"
                onClick={() => onDelete(restaurant)}
              >
                Delete Restaurant
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
