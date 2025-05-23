
import React, { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  SortingState,
  getSortedRowModel,
  ColumnFiltersState,
  getFilteredRowModel,
} from '@tanstack/react-table';
import {
  ArrowUpDown,
  ChevronDown,
  MoreHorizontal,
  Edit,
  Trash2
} from 'lucide-react';

import { Note } from '@/integrations/supabase/notes';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import NoteForm from './NoteForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface NotesTableProps {
  notes: Note[];
  onUpdateNote: (note: Note) => Promise<void>;
  onDeleteNote: (id: string) => Promise<void>;
}

const STATUS_COLORS = {
  'a_fazer': 'bg-blue-100 text-blue-800',
  'em_producao': 'bg-yellow-100 text-yellow-800',
  'finalizado': 'bg-green-100 text-green-800',
  'cancelado': 'bg-red-100 text-red-800',
};

const STATUS_LABELS = {
  'a_fazer': 'A fazer',
  'em_producao': 'Em produção',
  'finalizado': 'Finalizado',
  'cancelado': 'Cancelado',
};

const NotesTable: React.FC<NotesTableProps> = ({
  notes,
  onUpdateNote,
  onDeleteNote,
}) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  const columns: ColumnDef<Note>[] = [
    {
      accessorKey: 'title',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Título
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div
          className="font-medium cursor-pointer"
          onClick={() => {
            setSelectedNote(row.original);
            setDetailDialogOpen(true);
          }}
          style={{ 
            borderLeft: row.original.color ? `3px solid ${row.original.color}` : undefined,
            paddingLeft: row.original.color ? '8px' : undefined
          }}
        >
          {row.getValue('title')}
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Status
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const status = row.getValue('status') as string;
        return (
          <Badge 
            variant="outline" 
            className={cn(STATUS_COLORS[status as keyof typeof STATUS_COLORS])}
          >
            {STATUS_LABELS[status as keyof typeof STATUS_LABELS]}
          </Badge>
        );
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
    },
    {
      accessorKey: 'consultant_name',
      header: 'Consultor',
      cell: ({ row }) => <div>{row.original.consultant_name || "-"}</div>,
    },
    {
      accessorKey: 'client_name',
      header: 'Cliente',
      cell: ({ row }) => <div>{row.original.client_name || "-"}</div>,
    },
    {
      accessorKey: 'due_date',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Data de Entrega
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const dueDate = row.original.due_date;
        return (
          <div>{dueDate ? format(new Date(dueDate), "dd/MM/yyyy", { locale: ptBR }) : "-"}</div>
        );
      },
    },
    {
      accessorKey: 'created_at',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Criado em
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => format(new Date(row.original.created_at!), "dd/MM/yyyy", { locale: ptBR }),
    },
    {
      id: 'actions',
      enableHiding: false,
      cell: ({ row }) => {
        const note = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Abrir menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="flex items-center"
                onClick={() => {
                  setSelectedNote(note);
                  setDetailDialogOpen(true);
                }}
              >
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                className="flex items-center text-red-600"
                onClick={() => onDeleteNote(note.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data: notes,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
  });

  return (
    <div>
      <div className="flex items-center py-4">
        <Input
          placeholder="Buscar por título..."
          value={(table.getColumn('title')?.getFilterValue() as string) || ''}
          onChange={(e) => table.getColumn('title')?.setFilterValue(e.target.value)}
          className="max-w-sm mr-4"
        />
        
        <Select
          value={(table.getColumn('status')?.getFilterValue() as string[])?.join(',') || ''}
          onValueChange={(value) => {
            table.getColumn('status')?.setFilterValue(
              value ? value.split(',') : []
            );
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos os status</SelectItem>
            <SelectItem value="a_fazer">A fazer</SelectItem>
            <SelectItem value="em_producao">Em produção</SelectItem>
            <SelectItem value="finalizado">Finalizado</SelectItem>
            <SelectItem value="cancelado">Cancelado</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
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
                  Nenhuma anotação encontrada.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="text-sm text-muted-foreground">
          Página{" "}
          <span className="font-medium">
            {table.getState().pagination.pageIndex + 1}
          </span>{" "}
          de{" "}
          <span className="font-medium">{table.getPageCount()}</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Próxima
        </Button>
      </div>
      
      {/* Dialog para edição da nota selecionada */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Anotação</DialogTitle>
          </DialogHeader>
          {selectedNote && (
            <NoteForm
              initialData={selectedNote}
              onSave={async (updatedNote) => {
                await onUpdateNote(updatedNote);
                setDetailDialogOpen(false);
              }}
              onClose={() => setDetailDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NotesTable;
