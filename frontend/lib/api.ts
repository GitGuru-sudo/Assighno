import { BackendUser, AssignmentDetail, AssignmentSummary } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

const request = async <T>(path: string, token: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(errorBody.error ?? 'Request failed');
  }

  return response.json();
};

export const syncUser = async (token: string, displayName?: string): Promise<BackendUser> => {
  const data = await request<{ user: BackendUser }>('/api/auth/sync', token, {
    method: 'POST',
    body: JSON.stringify(
      displayName
        ? {
            display_name: displayName,
          }
        : {},
    ),
  });

  return data.user;
};

export const fetchCurrentUser = async (token: string): Promise<BackendUser> => {
  const data = await request<{ user: BackendUser }>('/api/users/me', token);
  return data.user;
};

export const generateLinkingCode = async (token: string): Promise<{ code: string; expires_at: string }> => {
  return request('/api/users/linking-code', token, {
    method: 'POST',
  });
};

export const fetchAssignments = async (token: string): Promise<AssignmentSummary[]> => {
  const data = await request<{ assignments: AssignmentSummary[] }>('/api/assignments', token);
  return data.assignments;
};

export const fetchAssignmentDetail = async (token: string, assignmentId: string): Promise<AssignmentDetail> => {
  const data = await request<{ assignment: AssignmentDetail }>(`/api/assignments/${assignmentId}`, token);
  return data.assignment;
};

export const markAssignmentSubmitted = async (token: string, assignmentId: string): Promise<AssignmentDetail> => {
  const data = await request<{ assignment: AssignmentDetail }>(`/api/assignments/${assignmentId}`, token, {
    method: 'PATCH',
    body: JSON.stringify({
      action: 'mark_submitted',
    }),
  });

  return data.assignment;
};

export const extendAssignmentDeadline = async (
  token: string,
  assignmentId: string,
  deadlineInput: string,
): Promise<AssignmentDetail> => {
  const data = await request<{ assignment: AssignmentDetail }>(`/api/assignments/${assignmentId}`, token, {
    method: 'PATCH',
    body: JSON.stringify({
      action: 'extend_deadline',
      deadline_input: deadlineInput,
    }),
  });

  return data.assignment;
};
