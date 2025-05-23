
export interface Stage {
  id: string;
  name: string;
  hours: number;
  days: number;
  value: number;
  startDate: string;
  endDate: string;
  completed: boolean;
  clientApproved: boolean;
  consultantPaid: boolean;
}

export interface Consultant {
  id: string;
  name: string;
  email: string;
  pix_key?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  serviceId?: string;
  mainConsultantId: string;
  mainConsultantName?: string;
  mainConsultantPixKey?: string;
  supportConsultantId?: string;
  supportConsultantName?: string;
  supportConsultantPixKey?: string;
  startDate: string;
  endDate: string;
  totalValue: number;
  taxPercent: number;
  thirdPartyExpenses?: number;
  consultantValue?: number;
  supportConsultantValue?: number;
  status: 'planned' | 'active' | 'completed' | 'cancelled';
  stages: Stage[];
  completedStages?: number;
}
