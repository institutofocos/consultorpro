
import { Json } from "@/integrations/supabase/types";

// Project type definition
export interface Project {
  id: string;
  name: string;
  description: string;
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
  thirdPartyExpenses: number;
  consultantValue: number;
  status: 'planned' | 'active' | 'completed' | 'cancelled';
  stages: Stage[];
  completedStages: number;
}

// Stage type definition for type safety
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

// Consultant type that's compatible with supabase interface
export interface Consultant {
  id: string;
  name: string;
  email: string;
  phone?: string;
  commission_percentage?: number;
  salary?: number;
  pix_key?: string;
  created_at?: string;
  updated_at?: string;
}
