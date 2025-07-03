
import React, { useState } from 'react';
import { TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight, Edit, Trash2, MoreHorizontal } from 'lucide-react';
import { ProjectGroup } from '@/hooks/useProjectGroups';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface ProjectGroupRowProps {
  group: ProjectGroup;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const ProjectGroupRow: React.FC<ProjectGroupRowProps> = ({
  group,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
}) => {
  const handleDelete = () => {
    if (window.confirm(`Tem certeza que deseja desfazer o grupo "${group.name}"? Os projetos não serão excluídos.`)) {
      onDelete();
    }
  };

  return (
    <TableRow className="bg-blue-50 hover:bg-blue-100">
      <TableCell className="font-semibold">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="p-0 h-6 w-6"
            onClick={onToggleExpand}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
          <span className="font-bold text-blue-900">📁 {group.name}</span>
        </div>
      </TableCell>
      
      {/* Status column - onde agora vai o badge de quantidade de projetos */}
      <TableCell className="text-center align-middle">
        <div className="flex justify-center">
          <Badge variant="secondary" className="inline-flex items-center justify-center">
            {group.project_count || 0} projeto(s)
          </Badge>
        </div>
      </TableCell>
      
      {/* Empty cells for other columns to maintain table structure */}
      <TableCell>-</TableCell>
      <TableCell>-</TableCell>
      <TableCell>-</TableCell>
      <TableCell>-</TableCell>
      <TableCell>-</TableCell>
      <TableCell>-</TableCell>
      <TableCell>-</TableCell>
      <TableCell>-</TableCell>
      <TableCell>-</TableCell>
      
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
            >
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Abrir menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={onEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Editar Nome
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleDelete} className="text-red-600">
              <Trash2 className="h-4 w-4 mr-2" />
              Desfazer Grupo
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
};

export default ProjectGroupRow;
