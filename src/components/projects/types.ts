
export interface Stage {
  id: string;
  name: string;
  description: string;
  days: number;
  hours: number;
  startDate?: string;
  endDate?: string;
  consultantId?: string;
}

export interface Project {
  id: string;
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
  status: 'planned' | 'active' | 'completed' | 'cancelled';
  stages: Stage[];
  tags?: string[];
}
