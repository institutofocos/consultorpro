
export interface ServiceStage {
  id: number;
  name: string;
  hours: number;
  days: number;
  value: number;
}

export interface Service {
  id: string;
  name: string;
  description?: string;
  totalHours: number;
  hourlyRate?: number;
  totalValue: number;
  taxRate: number;
  stages?: ServiceStage[];
}

export interface BasicService {
  id: string;
  name: string;
  total_value: number;
  tax_rate: number;
  stages?: any;
}

export interface BasicClient {
  id: string;
  name: string;
  contact_name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  notes?: string;
}
