
export interface Project {
  id: string;
  projectId?: string;
  name: string;
  description?: string;
  serviceId?: string;
  clientId?: string;
  mainConsultantId?: string;
  mainConsultantCommission?: number;
  supportConsultantId?: string;
  supportConsultantCommission?: number;
  startDate: string;
  endDate: string;
  totalValue: number;
  taxPercent?: number;
  thirdPartyExpenses?: number;
  consultantValue?: number;
  supportConsultantValue?: number;
  managerName?: string;
  managerEmail?: string;
  managerPhone?: string;
  totalHours?: number;
  hourlyRate?: number;
  status: string; // Changed from union type to string to support dynamic statuses
  tags?: string[];
  tagIds?: string[];
  tagNames?: string[];
  stages?: Stage[];
  url?: string;

  // Extended properties
  mainConsultantName?: string;
  supportConsultantName?: string;
  serviceName?: string;
  clientName?: string;
  completedStages?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Stage {
  id: string;
  projectId: string;
  name: string;
  description: string;
  days: number;
  hours: number;
  value: number;
  startDate: string;
  endDate: string;
  consultantId?: string;
  completed: boolean;
  clientApproved: boolean;
  managerApproved: boolean;
  invoiceIssued: boolean;
  paymentReceived: boolean;
  consultantsSettled: boolean;
  attachment?: string;
  stageOrder: number;
  status: string;
  createdAt?: string;
  updatedAt?: string;
  tags?: string[];
  tagIds?: string[];
}

export interface StageStatusType {
  key: string;
  label: string;
  color: string;
  description: string;
}

export interface ProjectTag {
  id: string;
  name: string;
  color?: string;
}
