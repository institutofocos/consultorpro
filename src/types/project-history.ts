
export interface ProjectHistory {
  id: string;
  project_id: string;
  stage_id?: string;
  action_type: string; // Changed from union type to string for flexibility
  field_changed?: string;
  old_value?: string;
  new_value?: string;
  description: string;
  user_id?: string;
  user_name?: string;
  created_at: string;
}
