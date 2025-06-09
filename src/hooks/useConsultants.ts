
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useConsultants = () => {
  return useQuery({
    queryKey: ['consultants'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('consultants')
        .select('id, name')
        .order('name');
      
      if (error) {
        console.error('Error fetching consultants:', error);
        throw error;
      }
      
      return data || [];
    },
  });
};
