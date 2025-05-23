
import React, { useEffect } from 'react';
import { Dashboard } from '@/components/dashboard/Dashboard';
import Layout from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';

const Index = () => {
  // Check if the projects table exists, if not create it
  useEffect(() => {
    const checkProjects = async () => {
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('id')
          .limit(1);
          
        if (error) {
          console.error('Error checking projects table:', error);
        }
      } catch (error) {
        console.error('Error checking projects table:', error);
      }
    };

    checkProjects();
  }, []);

  return <Dashboard />;
};

export default Index;
