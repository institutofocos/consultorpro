
export interface ServiceStage {
  id: number;
  name: string;
  hours: number;
  days: number;
  value: number;
}

export interface ServiceTag {
  id: string;
  name: string;
}

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Service {
  id: string;
  name: string;
  description?: string;
  totalHours: number;
  hourlyRate?: number;
  totalValue: number;
  taxRate: number;
  extraCosts?: number;
  netValue?: number;
  stages?: ServiceStage[];
  tags?: ServiceTag[];
}

export interface BasicService {
  id: string;
  name: string;
  total_value: number;
  totalValue?: number;
  tax_rate: number;
  stages?: any;
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

export interface ServiceData {
  id: string;
  name: string;
  description?: string;
  total_hours: number;
  hourly_rate?: number;
  total_value: number;
  tax_rate: number;
  stages?: Json;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  client_id: string;
  service_id?: string;
  main_consultant_id: string;
  support_consultant_id?: string;
  start_date: string;
  end_date: string;
  total_value: number;
  tax_percent: number;
  third_party_expenses: number;
  main_consultant_value: number;
  support_consultant_value?: number;
  net_value: number;
  status: 'planned' | 'active' | 'completed' | 'delayed';
  stages?: ProjectStage[];
  created_at?: string;
  updated_at?: string;
}

export interface ProjectStage {
  id: number;
  name: string;
  hours: number;
  days: number;
  value: number;
  startDate: string;
  endDate: string;
  completed?: boolean;
}
