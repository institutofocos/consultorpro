
import React, { useEffect } from 'react';
import { Dashboard } from '@/components/dashboard/Dashboard';
import Layout from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';

const Index = () => {
  // Check if the projects table exists, if not create it
  useEffect(() => {
    const checkAndCreateProjectsTable = async () => {
      // Check if projects table exists by trying to select from it
      const { error } = await supabase
        .from('projects')
        .select('id')
        .limit(1);

      // If there's an error, the table might not exist, but we don't want to 
      // create it here as it should be done through proper migrations
      if (error) {
        console.log('Projects table may need to be created via SQL migrations');
      }
    };

    checkAndCreateProjectsTable();
  }, []);

  return <Dashboard />;
};

export default Index;
