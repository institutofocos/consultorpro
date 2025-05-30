
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
}

export interface ProjectTag {
  id: string;
  name: string;
  color?: string;
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
  consultantValue?: number;
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
  stages?: Stage[];
  // Extended properties from joins
  mainConsultantName?: string;
  mainConsultantPixKey?: string;
  supportConsultantName?: string;
  supportConsultantPixKey?: string;
  serviceName?: string;
  clientName?: string;
  completedStages?: number;
  createdAt?: string;
  updatedAt?: string;
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
