
import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, Edit, Trash2 } from 'lucide-react';
import { ProjectGroup } from '@/hooks/useProjectGroups';

interface ProjectGroupRowProps {
  group: ProjectGroup;
  onToggleExpansion: (groupId: string) => void;
  onRename: (groupId: string, currentName: string) => void;
  onDelete: (groupId: string) => void;
}

const ProjectGroupRow: React.FC<ProjectGroupRowProps> = ({
  group,
  onToggleExpansion,
  onRename,
  onDelete
}) => {
  return (
    <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded-r-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggleExpansion(group.id)}
            className="p-1 h-6 w-6"
          >
            {group.isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
          <h3 className="font-semibold text-blue-900">{group.name}</h3>
          <span className="text-sm text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
            {group.projectIds.length} projeto(s)
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRename(group.id, group.name)}
            className="p-1 h-6 w-6 hover:bg-blue-100"
            title="Renomear grupo"
          >
            <Edit className="h-3 w-3 text-blue-600" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(group.id)}
            className="p-1 h-6 w-6 hover:bg-red-100"
            title="Excluir grupo"
          >
            <Trash2 className="h-3 w-3 text-red-600" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProjectGroupRow;
