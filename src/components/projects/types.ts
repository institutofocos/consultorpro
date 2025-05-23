export interface Project {
  id: string;
  name: string;
  description: string;
  serviceId?: string;
  mainConsultantId: string;
  mainConsultantName?: string;
  mainConsultantPixKey?: string;
  mainConsultantCommission?: number;
  supportConsultantId?: string;
  supportConsultantName?: string;
  supportConsultantPixKey?: string;
  supportConsultantCommission?: number;
  startDate: string;
  endDate: string;
  totalValue: number;
  taxPercent: number;
  thirdPartyExpenses: number;
  consultantValue: number;
  supportConsultantValue: number;
  status: 'planned' | 'active' | 'completed' | 'cancelled';
  stages: Stage[];
  completedStages?: number;
  tags: string[];
}

export interface Stage {
  id: string;
  name: string;
  description?: string;
  days: number;
  hours: number;
  value: number;
  startDate: string;
  endDate: string;
  completed: boolean;
  clientApproved: boolean;
  consultantPaid: boolean;
  attachment?: string;
}
