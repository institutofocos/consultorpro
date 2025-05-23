
export interface Stage {
  id: string;
  name: string;
  description?: string; // Added description field
  hours: number;
  days: number;
  value: number;
  startDate: string;
  endDate: string;
  completed: boolean;
  clientApproved: boolean;
  consultantPaid: boolean;
  attachment?: string; // Added attachment field
}

export interface Consultant {
  id: string;
  name: string;
  email: string;
  pix_key?: string;
  commission_percentage?: number; // Added to access consultant's default commission
}

export interface Project {
  id: string;
  name: string;
  description: string;
  serviceId?: string;
  mainConsultantId: string;
  mainConsultantName?: string;
  mainConsultantPixKey?: string;
  mainConsultantCommission?: number; // Added field for project-specific commission
  supportConsultantId?: string;
  supportConsultantName?: string;
  supportConsultantPixKey?: string;
  supportConsultantCommission?: number; // Added field for project-specific commission
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
  tags?: string[]; // Added tags field
}
