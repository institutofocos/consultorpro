
import React, { useState } from 'react';
import { TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight, Edit, Trash2 } from 'lucide-react';
import { ProjectGroup } from '@/hooks/useProjectGroups';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
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
    if (window.confirm(`Tem certeza que deseja excluir o grupo "${group.name}"? Os projetos não serão excluídos.`)) {
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
          <Badge variant="secondary" className="ml-2">
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
      <TableCell>-</TableCell>
      <TableCell>-</TableCell>
      
      <TableCell className="text-right">
        <div className="flex justify-end space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Ações
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Editar Nome
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir Grupo
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>
    </TableRow>
  );
};

export default ProjectGroupRow;
