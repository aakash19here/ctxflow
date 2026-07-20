"use client";

import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";
import * as React from "react";

import { trpc } from "@/utils/trpc";
import { AppRouter } from "@repo/rpc";
import { Button } from "@repo/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@repo/ui/components/alert-dialog";

import { Alert, AlertTitle } from "@repo/ui/components/alert";

import { Skeleton } from "@repo/ui/components/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { inferRouterOutputs } from "@trpc/server";
import { MoreVertical, TrashIcon, TriangleAlertIcon } from "lucide-react";
import { toast } from "sonner";

type RouterOutput = inferRouterOutputs<AppRouter>;
type Source = RouterOutput["source"]["list"][0];

export const columns: ColumnDef<Source>[] = [
  {
    accessorKey: "name",
    header: () => {
      return <h1>Files</h1>;
    },
    cell: ({ row }) => <div>{row.getValue("name")}</div>,
  },
  {
    accessorKey: "status",
    header: () => <h1 className="text-right">Status</h1>,
    cell: ({ row }) => (
      <div className="capitalize text-right text-xs flex items-center gap-2 justify-end">
        <h1 className="font-semibold">{row.getValue("status")}</h1>
        <Status status={row.getValue("status")} />
      </div>
    ),
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const source = row.original;

      if (!source.isDeletable) {
        return null;
      }

      const [confirmDelete, setConfirmDelete] = React.useState(false);
      const [menu, setMenu] = React.useState(false);
      const queryClient = useQueryClient();

      const { mutateAsync, isPending } = useMutation(
        trpc.source.delete.mutationOptions({
          onSuccess: () => {
            toast.success("Successfully deleted the source");

            queryClient.invalidateQueries({
              queryKey: trpc.source.list.queryKey(),
            });

            setConfirmDelete(false);
            setMenu(false);
          },
          onError: (error) => {
            toast.error(error.message);
          },
        })
      );

      return (
        <DropdownMenu open={menu} onOpenChange={setMenu}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="size-4 p-0 ml-auto"
              size={"icon"}
            >
              <span className="sr-only">Open menu</span>
              <MoreVertical />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={(e) => {
                e.preventDefault();
              }}
              className="p-0"
            >
              <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="border-none">
                    Delete source <TrashIcon className="text-red-600 " />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Are you absolutely sure?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete
                      the source and remove its data from our servers.
                    </AlertDialogDescription>
                  </AlertDialogHeader>

                  <Alert variant="destructive" className="w-full">
                    <TriangleAlertIcon />
                    <AlertTitle>
                      Deleting {source.name} cannot be undone.
                    </AlertTitle>
                  </Alert>

                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={isPending}>
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      disabled={isPending}
                      onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        await mutateAsync({ id: source.id, name: source.name });
                      }}
                    >
                      {isPending ? "Deleting..." : "Delete"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

export function DataTableDemo() {
  const { data: sources, isPending } = useQuery(
    trpc.source.list.queryOptions()
  );

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const table = useReactTable({
    data: sources || [],
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  return (
    <div className="w-full max-w-7xl">
      <div className="overflow-hidden rounded-md border">
        {isPending && <TableSkeleton />}
        {!isPending && sources && (
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

function Status({ status }: { status: Source["status"] }) {
  if (status === "success") {
    return <div className="size-1.5 rounded-full bg-green-500" />;
  } else if (status === "pending") {
    return <div className="size-1.5 rounded-full bg-yellow-500" />;
  } else if (status === "failed") {
    return <div className="size-1.5 rounded-full bg-red-500" />;
  } else if (status === "processing") {
    return <div className="size-1.5 rounded-full bg-blue-500" />;
  }
}

function TableSkeleton() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Files</TableHead>
          <TableHead className="text-right">Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {[...Array(5)].map((_, i) => (
          <TableRow key={i}>
            <TableCell>
              <Skeleton className="h-4 w-4/5" />
            </TableCell>
            <TableCell>
              <div className="flex items-center justify-end gap-2">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="size-2 rounded-full" />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
