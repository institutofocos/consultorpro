
import { useState, useCallback } from 'react';

export interface ProjectGroup {
  id: string;
  name: string;
  projectIds: string[];
  isExpanded: boolean;
  createdAt: Date;
}

export const useProjectGroups = () => {
  const [groups, setGroups] = useState<ProjectGroup[]>([]);
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);

  const createGroup = useCallback((name: string, projectIds: string[]) => {
    const newGroup: ProjectGroup = {
      id: crypto.randomUUID(),
      name,
      projectIds: [...projectIds],
      isExpanded: true,
      createdAt: new Date()
    };
    
    setGroups(prev => [...prev, newGroup]);
    setSelectedProjectIds([]);
    return newGroup;
  }, []);

  const updateGroup = useCallback((groupId: string, updates: Partial<ProjectGroup>) => {
    setGroups(prev => prev.map(group => 
      group.id === groupId ? { ...group, ...updates } : group
    ));
  }, []);

  const deleteGroup = useCallback((groupId: string) => {
    setGroups(prev => prev.filter(group => group.id !== groupId));
  }, []);

  const toggleGroupExpansion = useCallback((groupId: string) => {
    setGroups(prev => prev.map(group => 
      group.id === groupId ? { ...group, isExpanded: !group.isExpanded } : group
    ));
  }, []);

  const toggleProjectSelection = useCallback((projectId: string) => {
    setSelectedProjectIds(prev => 
      prev.includes(projectId) 
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    );
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedProjectIds([]);
  }, []);

  const isProjectInAnyGroup = useCallback((projectId: string) => {
    return groups.some(group => group.projectIds.includes(projectId));
  }, [groups]);

  const getProjectGroup = useCallback((projectId: string) => {
    return groups.find(group => group.projectIds.includes(projectId));
  }, [groups]);

  return {
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
  };
};
