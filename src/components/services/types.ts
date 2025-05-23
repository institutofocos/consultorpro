export interface ServiceStage {
  id: number;
  name: string;
  description?: string;
  days?: number;
  hours: number;
  value: number;
  attachment?: string;
  attachmentName?: string;
}

export interface ServiceTag {
  id: string;
  name: string;
}

export interface Service {
  id: string;
  name: string;
  description?: string;
  totalHours: number;
  hourlyRate: number;
  totalValue: number;
  taxRate: number;
  extraCosts: number;
  netValue: number;
  stages: ServiceStage[];
  tags: ServiceTag[];
}

export interface BasicService {
  id: string;
  name: string;
  description?: string;
}

export interface BasicClient {
  id: string;
  name: string;
  contact_name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  notes?: string | null;
}

// Import Stage type from the projects module
import { Stage } from "../projects/types";

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

export interface ProjectStage {
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

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]
