
export type IndicatorType = 'kpi' | 'okr';

export type IndicatorStatus = 'on_track' | 'at_risk' | 'off_track' | 'completed' | 'not_started';

export type IndicatorPeriod = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export type IndicatorCategory = 
  | 'financial' 
  | 'consultants' 
  | 'projects' 
  | 'clients' 
  | 'services' 
  | 'quality' 
  | 'efficiency' 
  | 'growth' 
  | 'custom';

export interface Indicator {
  id: string;
  name: string;
  description: string;
  type: IndicatorType;
  category: IndicatorCategory;
  target: number;
  current: number;
  unit: string;
  period: IndicatorPeriod;
  startDate: string;
  endDate: string;
  status: IndicatorStatus;
  dataSource: string;
  formula?: string;
  responsible?: string;
  createdAt: string;
  updatedAt: string;
}

export interface KPI extends Indicator {
  type: 'kpi';
}

export interface OKR extends Indicator {
  type: 'okr';
  keyResults: KeyResult[];
}

export interface KeyResult {
  id: string;
  name: string;
  description?: string;
  target: number;
  current: number;
  unit: string;
  status: IndicatorStatus;
}
