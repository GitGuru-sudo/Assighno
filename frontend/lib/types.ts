export type BackendUser = {
  id: string;
  display_name?: string | null;
  email: string;
  telegram_id?: string | null;
  telegram_username?: string | null;
  telegram_linked_at?: string | null;
};

export type AssignmentSummary = {
  _id: string;
  title: string;
  deadline: string | null;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'submitted';
  created_at: string;
  submitted_at?: string | null;
  reminder_last_sent_at?: string | null;
  error_message?: string | null;
};

export type AssignmentQuestion = {
  _id: string;
  question_text: string;
  ai_solution: string;
  status: 'queued' | 'completed';
};

export type AssignmentDetail = AssignmentSummary & {
  cleaned_content: string;
  source_type: 'text' | 'pdf' | 'image';
  source_file_name?: string;
  questions: AssignmentQuestion[];
};
