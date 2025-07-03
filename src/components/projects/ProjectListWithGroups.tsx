
import React, { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { useProjectGroups } from '@/hooks/useProjectGroups';
import ProjectGroupModal from './ProjectGroupModal';
import ProjectGroupRow from './ProjectGroupRow';
import ProjectsExpandedTable from './ProjectsExpandedTable';
import { Project } from './types';
import { toast } from 'sonner';

interface ProjectListWithGroupsProps {
  projects: Project[];
  onDeleteProject: (id: string) => void;
  onEditProject: (project: any) => void;
  onRefresh: () => Promise<any>;
}

const ProjectListWithGroups: React.FC<ProjectListWithGroupsProps> = ({
  projects,
  onDeleteProject,
  onEditProject,
  onRefresh
}) => {
  const {
    groups,
    selectedProjectIds,
    createGroup,
    updateGroup,
    deleteGroup,
    toggleGroupExpansion,
    toggleProjectSelection,
    clearSelection,
    isProjectInAnyGroup,
    getProjectGroup
  } = useProjectGroups();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [renamingGroup, setRenamingGroup] = useState<{ id: string; name: string } | null>(null);

  const handleCreateGroup = (name: string) => {
    if (selectedProjectIds.length === 0) {
      toast.error('Selecione pelo menos um projeto para criar um grupo');
      return;
    }

    createGroup(name, selectedProjectIds);
    toast.success(`Grupo "${name}" criado com sucesso!`);
  };

  const handleRenameGroup = (groupId: string, currentName: string) => {
    setRenamingGroup({ id: groupId, name: currentName });
    setIsRenameModalOpen(true);
  };

  const handleSaveRename = (newName: string) => {
    if (renamingGroup) {
      updateGroup(renamingGroup.id, { name: newName });
      toast.success(`Grupo renomeado para "${newName}"`);
    }
    setRenamingGroup(null);
  };

  const handleDeleteGroup = (groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    if (group && window.confirm(`Tem certeza que deseja excluir o grupo "${group.name}"?`)) {
      deleteGroup(groupId);
      toast.success(`Grupo "${group.name}" excluído com sucesso!`);
    }
  };

  const handleProjectSelection = (projectId: string, checked: boolean) => {
    if (isProjectInAnyGroup(projectId)) {
      toast.error('Este projeto já está em um grupo');
      return;
    }
    toggleProjectSelection(projectId);
  };

  // Separar projetos agrupados dos não agrupados
  const ungroupedProjects = projects.filter(project => !isProjectInAnyGroup(project.id));
  
  // Criar estrutura de renderização
  const renderItems = [];

  // Adicionar grupos
  groups.forEach(group => {
    renderItems.push({
      type: 'group',
      group,
      projects: projects.filter(project => group.projectIds.includes(project.id))
    });
  });

  // Adicionar projetos não agrupados
  if (ungroupedProjects.length > 0) {
    renderItems.push({
      type: 'projects',
      projects: ungroupedProjects
    });
  }

  return (
    <div className="space-y-4">
      {/* Barra de ações */}
      {selectedProjectIds.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-700 font-medium">
              {selectedProjectIds.length} projeto(s) selecionado(s)
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={clearSelection}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={() => setIsCreateModalOpen(true)}
              >
                Criar Grupo
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Renderizar grupos e projetos */}
      <div className="space-y-3">
        {renderItems.map((item, index) => (
          <div key={index}>
            {item.type === 'group' && (
              <div className="space-y-2">
                <ProjectGroupRow
                  group={item.group}
                  onToggleExpansion={toggleGroupExpansion}
                  onRename={handleRenameGroup}
                  onDelete={handleDeleteGroup}
                />
                {item.group.isExpanded && (
                  <div className="ml-8 border-l-2 border-blue-200 pl-4">
                    <ProjectsExpandedTable
                      projects={item.projects}
                      onDeleteProject={onDeleteProject}
                      onEditProject={onEditProject}
                      onRefresh={onRefresh}
                      showCheckboxes={false}
                      onProjectSelection={handleProjectSelection}
                      selectedProjectIds={selectedProjectIds}
                    />
                  </div>
                )}
              </div>
            )}
            {item.type === 'projects' && (
              <ProjectsExpandedTable
                projects={item.projects}
                onDeleteProject={onDeleteProject}
                onEditProject={onEditProject}
                onRefresh={onRefresh}
                showCheckboxes={true}
                onProjectSelection={handleProjectSelection}
                selectedProjectIds={selectedProjectIds}
              />
            )}
          </div>
        ))}
      </div>

      {/* Modal de criação de grupo */}
      <ProjectGroupModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleCreateGroup}
        title="Criar Novo Grupo"
        selectedCount={selectedProjectIds.length}
      />

      {/* Modal de renomeação de grupo */}
      <ProjectGroupModal
        isOpen={isRenameModalOpen}
        onClose={() => {
          setIsRenameModalOpen(false);
          setRenamingGroup(null);
        }}
        onSave={handleSaveRename}
        title="Renomear Grupo"
        initialName={renamingGroup?.name || ''}
      />
    </div>
  );
};

export default ProjectListWithGroups;
