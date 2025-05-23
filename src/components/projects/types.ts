
export interface Stage {
  id: string;
  name: string;
  description?: string;
  hours: number;
  days: number;
  value: number;
  startDate: string;
  endDate: string;
  completed: boolean;
  clientApproved: boolean;
  consultantPaid: boolean;
  attachment?: string;
}

export interface Consultant {
  id: string;
  name: string;
  email: string;
  pix_key?: string;
  commission_percentage?: number;
}

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
  thirdPartyExpenses?: number;
  consultantValue?: number;
  supportConsultantValue?: number;
  status: 'planned' | 'active' | 'completed' | 'cancelled';
  stages: Stage[];
  completedStages?: number;
  tags?: string[];
}
