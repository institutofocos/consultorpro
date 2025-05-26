
export interface ProjectHistory {
  id: string;
  project_id: string;
  stage_id?: string;
  action_type: 'created' | 'updated' | 'status_changed' | 'stage_created' | 'stage_updated' | 'stage_status_changed';
  field_changed?: string;
  old_value?: string;
  new_value?: string;
  description: string;
  user_id?: string;
  user_name?: string;
  created_at: string;
}
