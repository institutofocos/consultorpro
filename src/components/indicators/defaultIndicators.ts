
import { KPI, OKR } from './types';

export const defaultKPIs: KPI[] = [
  {
    id: '1',
    name: 'Receita Mensal',
    description: 'Receita total gerada por mês',
    type: 'kpi',
    category: 'financial',
    target: 100000,
    current: 0,
    unit: 'BRL',
    period: 'monthly',
    startDate: new Date().toISOString(),
    endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString(),
    status: 'not_started',
    dataSource: 'projects',
    formula: 'SUM(project.total_value WHERE project.created_at BETWEEN startDate AND endDate)',
    responsible: 'Financeiro',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Taxa de Conclusão de Projetos',
    description: 'Percentual de projetos concluídos dentro do prazo',
    type: 'kpi',
    category: 'projects',
    target: 90,
    current: 0,
    unit: '%',
    period: 'monthly',
    startDate: new Date().toISOString(),
    endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString(),
    status: 'not_started',
    dataSource: 'projects',
    formula: '(COUNT(project WHERE status = "completed" AND end_date <= planned_end_date) / COUNT(project WHERE status = "completed")) * 100',
    responsible: 'Gerência de Projetos',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '3',
    name: 'Produtividade dos Consultores',
    description: 'Média de horas faturáveis por consultor',
    type: 'kpi',
    category: 'consultants',
    target: 160,
    current: 0,
    unit: 'horas',
    period: 'monthly',
    startDate: new Date().toISOString(),
    endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString(),
    status: 'not_started',
    dataSource: 'consultants',
    formula: 'AVG(consultant.billable_hours)',
    responsible: 'RH',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '4',
    name: 'Satisfação do Cliente',
    description: 'Média de avaliações dos clientes',
    type: 'kpi',
    category: 'clients',
    target: 4.5,
    current: 0,
    unit: 'estrelas',
    period: 'monthly',
    startDate: new Date().toISOString(),
    endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString(),
    status: 'not_started',
    dataSource: 'clients',
    formula: 'AVG(client.satisfaction_rating)',
    responsible: 'Atendimento ao Cliente',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '5',
    name: 'Valor Médio por Projeto',
    description: 'Valor médio dos projetos',
    type: 'kpi',
    category: 'projects',
    target: 50000,
    current: 0,
    unit: 'BRL',
    period: 'monthly',
    startDate: new Date().toISOString(),
    endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString(),
    status: 'not_started',
    dataSource: 'projects',
    formula: 'AVG(project.total_value WHERE created_at BETWEEN startDate AND endDate)',
    responsible: 'Comercial',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const defaultOKRs: OKR[] = [
  {
    id: '1',
    name: 'Aumentar Receita Trimestral',
    description: 'Aumentar a receita total da empresa no trimestre',
    type: 'okr',
    category: 'financial',
    target: 100,
    current: 0,
    unit: '%',
    period: 'quarterly',
    startDate: new Date().toISOString(),
    endDate: new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString(),
    status: 'not_started',
    dataSource: 'projects',
    responsible: 'Diretoria',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    keyResults: [
      {
        id: '1.1',
        name: 'Aumentar número de novos clientes',
        description: 'Captar novos clientes no trimestre',
        target: 10,
        current: 0,
        unit: 'clientes',
        status: 'not_started'
      },
      {
        id: '1.2',
        name: 'Aumentar valor médio dos projetos',
        description: 'Incrementar o valor médio dos projetos vendidos',
        target: 20,
        current: 0,
        unit: '%',
        status: 'not_started'
      },
      {
        id: '1.3',
        name: 'Reduzir taxa de cancelamento',
        description: 'Diminuir o número de projetos cancelados',
        target: 5,
        current: 0,
        unit: '%',
        status: 'not_started'
      }
    ]
  },
  {
    id: '2',
    name: 'Melhorar Desempenho da Equipe',
    description: 'Aumentar a produtividade e qualidade da equipe',
    type: 'okr',
    category: 'consultants',
    target: 100,
    current: 0,
    unit: '%',
    period: 'quarterly',
    startDate: new Date().toISOString(),
    endDate: new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString(),
    status: 'not_started',
    dataSource: 'consultants',
    responsible: 'RH',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    keyResults: [
      {
        id: '2.1',
        name: 'Implementar programa de capacitação',
        description: 'Treinamento para todos os consultores',
        target: 100,
        current: 0,
        unit: '%',
        status: 'not_started'
      },
      {
        id: '2.2',
        name: 'Melhorar avaliação de desempenho',
        description: 'Pontuação média nas avaliações de desempenho',
        target: 4.5,
        current: 0,
        unit: 'pontos',
        status: 'not_started'
      },
      {
        id: '2.3',
        name: 'Reduzir turnover',
        description: 'Diminuir a rotatividade de consultores',
        target: 10,
        current: 0,
        unit: '%',
        status: 'not_started'
      }
    ]
  }
];
