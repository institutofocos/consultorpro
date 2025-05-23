
import React, { useEffect } from 'react';
import { Dashboard } from '@/components/dashboard/Dashboard';
import Layout from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";

const Index = () => {
  // Check if we can access the projects table
  useEffect(() => {
    const checkProjects = async () => {
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('id')
          .limit(1);
          
        if (error) {
          console.error('Error checking projects table:', error);
          toast.error('Error connecting to database');
        } else {
          console.log('Successfully connected to projects table');
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
