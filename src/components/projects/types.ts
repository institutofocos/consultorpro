
export interface Stage {
  id: string;
  projectId: string;
  name: string;
  description: string;
  days: number;
  hours: number;
  value: number;
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  consultantId?: string;
  completed: boolean;
  clientApproved: boolean;
  managerApproved: boolean;
  invoiceIssued: boolean;
  paymentReceived: boolean;
  consultantsSettled: boolean;
  attachment?: string;
  stageOrder: number;
  status: 'iniciar_projeto' | 'em_producao' | 'aguardando_assinatura' | 'aguardando_aprovacao' | 'aguardando_nota_fiscal' | 'aguardando_pagamento' | 'aguardando_repasse' | 'finalizados' | 'cancelados' | string;
  valorDeRepasse?: number;
  createdAt?: string;
  updatedAt?: string;
  completedAt?: string;
  // Timer-related properties
  time_spent_minutes?: number;
  timer_status?: string;
  timer_started_at?: string;
  // Extended properties for Kanban
  projectName?: string;
  clientName?: string;
  consultantName?: string;
  consultantEmail?: string;
  consultantPhone?: string;
}

export interface ProjectTag {
  id: string;
  name: string;
  color?: string;
}

export interface ProjectTask {
  id: string;
  project_id: string;
  name: string;
  description?: string;
  assigned_consultant_id?: string;
  start_date?: string;
  end_date?: string;
  completed: boolean;
  completed_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Project {
  id: string;
  projectId?: string; // ID único de 9 caracteres
  name: string;
  description?: string;
  serviceId?: string;
  clientId?: string;
  mainConsultantId?: string;
  mainConsultantCommission: number;
  supportConsultantId?: string;
  supportConsultantCommission: number;
  startDate: string;
  endDate: string;
  totalValue: number;
  taxPercent: number;
  thirdPartyExpenses?: number;
  mainConsultantValue?: number;
  supportConsultantValue?: number;
  // Novos campos para gestor
  managerName?: string;
  managerEmail?: string;
  managerPhone?: string;
  // Novos campos de horas e valor
  totalHours?: number;
  hourlyRate?: number;
  // Campo URL
  url?: string;
  status: 'planned' | 'active' | 'completed' | 'cancelled' | 'em_producao' | 'aguardando_assinatura' | 'aguardando_aprovacao' | 'aguardando_nota_fiscal' | 'aguardando_pagamento' | 'aguardando_repasse' | 'concluido' | 'cancelado' | string;
  tags?: string[]; // Changed from ProjectTag[] to string[]
  tagIds?: string[];
  tagNames?: string[]; // Added this property to fix the TypeScript error
  tagColors?: string[];
  stages?: Stage[];
  // Extended properties from joins
  mainConsultantName?: string;
  mainConsultantEmail?: string;
  mainConsultantPhone?: string;
  mainConsultantPixKey?: string;
  supportConsultantName?: string;
  supportConsultantEmail?: string;
  supportConsultantPhone?: string;
  supportConsultantPixKey?: string;
  serviceName?: string;
  serviceDescription?: string;
  serviceUrl?: string;
  clientName?: string;
  clientContactName?: string;
  clientEmail?: string;
  clientPhone?: string;
  completedStages?: number;
  createdAt?: string;
  updatedAt?: string;
  // Database field mappings for Supabase queries
  project_stages?: Stage[];
  project_tasks?: ProjectTask[];
  clients?: {
    id: string;
    name: string;
    contact_name?: string;
  };
  services?: {
    id: string;
    name: string;
  };
  main_consultant?: {
    id: string;
    name: string;
    email?: string;
  };
  support_consultant?: {
    id: string;
    name: string;
    email?: string;
  };
}

export interface Consultant {
  id: string;
  name: string;
  email: string;
  phone?: string;
  pixKey?: string;
  commissionPercentage?: number;
  salary?: number;
  hoursPerMonth?: number;
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  education?: string;
  createdAt?: string;
  updatedAt?: string;
}
