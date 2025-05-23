
export interface Stage {
  id: string;
  name: string;
  description: string;
  days: number;
  hours: number;
  startDate?: string;
  endDate?: string;
  consultantId?: string;
  value: number;
  completed: boolean;
  clientApproved: boolean;
  managerApproved: boolean;
  invoiceIssued: boolean;
  paymentReceived: boolean;
  consultantsSettled: boolean;
  attachment?: string;
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
  // Extended properties from joins
  mainConsultantName?: string;
  mainConsultantPixKey?: string;
  supportConsultantName?: string;
  supportConsultantPixKey?: string;
  serviceName?: string;
  clientName?: string;
  completedStages?: number;
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
