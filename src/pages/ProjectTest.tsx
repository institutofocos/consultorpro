
import React from 'react';
import Layout from '@/components/layout/Layout';
import ProjectTestComponent from '@/components/projects/ProjectTestComponent';

const ProjectTest = () => {
  return (
    <Layout>
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Teste de Projetos</h1>
          <p className="text-gray-600 mt-2">
            Esta página permite testar a funcionalidade de criação de projetos após a correção do sistema.
          </p>
        </div>
        
        <ProjectTestComponent />
      </div>
    </Layout>
  );
};

export default ProjectTest;
