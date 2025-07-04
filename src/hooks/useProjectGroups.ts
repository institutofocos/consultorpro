import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ProjectGroup {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  project_ids?: string[];
  project_count?: number;
}

export const useProjectGroups = () => {
  const queryClient = useQueryClient();

  // Fetch all groups for the current user
  const { data: groups = [], isLoading, error } = useQuery({
    queryKey: ['projectGroups'],
    queryFn: async () => {
      const { data: groupsData, error: groupsError } = await supabase
        .from('project_groups')
        .select('*')
        .order('created_at', { ascending: false });

      if (groupsError) throw groupsError;

      // Fetch project relations for each group
      const { data: relationsData, error: relationsError } = await supabase
        .from('project_group_relations')
        .select('group_id, project_id');

      if (relationsError) throw relationsError;

      // Group project IDs by group
      const groupProjectMap = relationsData.reduce((acc, relation) => {
        if (!acc[relation.group_id]) {
          acc[relation.group_id] = [];
        }
        acc[relation.group_id].push(relation.project_id);
        return acc;
      }, {} as Record<string, string[]>);

      // Add project_ids and count to each group
      return groupsData.map(group => ({
        ...group,
        project_ids: groupProjectMap[group.id] || [],
        project_count: (groupProjectMap[group.id] || []).length,
      }));
    },
  });

  // Create a new group
  const createGroupMutation = useMutation({
    mutationFn: async ({ name, projectIds }: { name: string; projectIds: string[] }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Create the group
      const { data: groupData, error: groupError } = await supabase
        .from('project_groups')
        .insert({
          name,
          user_id: user.id,
        })
        .select()
        .single();

      if (groupError) throw groupError;

      // Add project relations
      if (projectIds.length > 0) {
        const relations = projectIds.map(projectId => ({
          group_id: groupData.id,
          project_id: projectId,
        }));

        const { error: relationsError } = await supabase
          .from('project_group_relations')
          .insert(relations);

        if (relationsError) throw relationsError;
      }

      return groupData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectGroups'] });
      toast.success('Grupo criado com sucesso!');
    },
    onError: (error) => {
      console.error('Error creating group:', error);
      toast.error('Erro ao criar grupo');
    },
  });

  // Update group name
  const updateGroupMutation = useMutation({
    mutationFn: async ({ groupId, name }: { groupId: string; name: string }) => {
      const { error } = await supabase
        .from('project_groups')
        .update({ name })
        .eq('id', groupId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectGroups'] });
      toast.success('Grupo atualizado com sucesso!');
    },
    onError: (error) => {
      console.error('Error updating group:', error);
      toast.error('Erro ao atualizar grupo');
    },
  });

  // Delete group (but keep projects)
  const deleteGroupMutation = useMutation({
    mutationFn: async (groupId: string) => {
      // Delete relations first (CASCADE should handle this, but being explicit)
      await supabase
        .from('project_group_relations')
        .delete()
        .eq('group_id', groupId);

      // Delete the group
      const { error } = await supabase
        .from('project_groups')
        .delete()
        .eq('id', groupId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectGroups'] });
      toast.success('Grupo excluído com sucesso!');
    },
    onError: (error) => {
      console.error('Error deleting group:', error);
      toast.error('Erro ao excluir grupo');
    },
  });

  // Add projects to group
  const addProjectsToGroupMutation = useMutation({
    mutationFn: async ({ groupId, projectIds }: { groupId: string; projectIds: string[] }) => {
      const relations = projectIds.map(projectId => ({
        group_id: groupId,
        project_id: projectId,
      }));

      const { error } = await supabase
        .from('project_group_relations')
        .insert(relations);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectGroups'] });
    },
    onError: (error) => {
      console.error('Error adding projects to group:', error);
      toast.error('Erro ao adicionar projetos ao grupo');
    },
  });

  // Remove projects from group
  const removeProjectsFromGroupMutation = useMutation({
    mutationFn: async ({ groupId, projectIds }: { groupId: string; projectIds: string[] }) => {
      const { error } = await supabase
        .from('project_group_relations')
        .delete()
        .eq('group_id', groupId)
        .in('project_id', projectIds);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectGroups'] });
    },
    onError: (error) => {
      console.error('Error removing projects from group:', error);
      toast.error('Erro ao remover projetos do grupo');
    },
  });

  return {
    groups,
    isLoading,
    error,
    createGroup: createGroupMutation.mutate,
    updateGroup: updateGroupMutation.mutate,
    deleteGroup: deleteGroupMutation.mutate,
    addProjectsToGroup: addProjectsToGroupMutation.mutate,
    removeProjectsFromGroup: removeProjectsFromGroupMutation.mutate,
    isCreating: createGroupMutation.isPending,
    isUpdating: updateGroupMutation.isPending,
    isDeleting: deleteGroupMutation.isPending,
  };
};
