const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://16.171.255.175:8000";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export async function api<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || JSON.stringify(err));
  }
  return res.json();
}

export const auth = {
  signup: (data: { full_name: string; email: string; password: string }) =>
    api<{ access_token: string; user: User }>("/auth/signup", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  login: (data: { email: string; password: string }) =>
    api<{ access_token: string; user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  me: () => api<User>("/auth/me"),
};

export const profile = {
  get: () => api<Profile>("/profile"),
  update: (data: Partial<Profile>) =>
    api<Profile>("/profile", { method: "PUT", body: JSON.stringify(data) }),
  complete: () => api<{ onboarding_complete: boolean }>("/profile/complete", { method: "POST" }),
};

export const dashboard = {
  get: () => api<DashboardResponse>("/dashboard"),
};

export const universities = {
  search: (params: { country?: string; name?: string }) => {
    const q = new URLSearchParams();
    if (params.country) q.set("country", params.country);
    if (params.name) q.set("name", params.name);
    return api<{ universities: UniversitySearch[] }>(`/universities/search?${q}`);
  },
  shortlist: () => api<UniversityShortlistItem[]>("/universities/shortlist"),
  addShortlist: (data: UniversityShortlistCreate) =>
    api<UniversityShortlistItem>("/universities/shortlist", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  removeShortlist: (id: string) =>
    api<{ ok: boolean }>(`/universities/shortlist/${id}`, { method: "DELETE" }),
  setLock: (id: string, lock: boolean) =>
    api<{ locked: boolean }>(`/universities/shortlist/${id}/lock`, {
      method: "POST",
      body: JSON.stringify({ lock }),
    }),
  recommendations: () =>
    api<{ dream: UniversitySearch[]; target: UniversitySearch[]; safe: UniversitySearch[] }>(
      "/universities/recommendations"
    ),
};

export const todos = {
  list: () => api<TodoItem[]>("/todos"),
  create: (data: { title: string; description?: string; category?: string }) =>
    api<TodoItem>("/todos", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Partial<TodoItem>) =>
    api<TodoItem>(`/todos/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (id: string) =>
    api<{ ok: boolean }>(`/todos/${id}`, { method: "DELETE" }),
};

export const counsellor = {
  history: () => api<ChatMessageItem[]>("/counsellor/history"),
  chat: (content: string) =>
    api<{ message: string; actions?: unknown[] }>("/counsellor/chat", {
      method: "POST",
      body: JSON.stringify({ content }),
    }),
};

export const applications = {
  get: () => api<ApplicationGuidance>("/applications"),
};

export interface User {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
}

export interface Profile {
  id: string;
  user_id: string;
  onboarding_complete: boolean;
  current_education_level?: string;
  degree_major?: string;
  graduation_year?: number | null;
  gpa?: string;
  intended_degree?: string;
  field_of_study?: string;
  target_intake_year?: number | null;
  preferred_countries?: string[];
  budget_min?: number | null;
  budget_max?: number | null;
  funding_plan?: string;
  exams?: { name: string; status: string }[];
  sop_status?: string;
  strength_academics?: string;
  strength_exams?: string;
  strength_sop?: string;
}

export interface DashboardResponse {
  profile_summary: {
    education: string;
    target_intake: string;
    countries: string[];
    budget: string;
  } | null;
  profile_strength: {
    academics: string;
    exams: string;
    sop: string;
  } | null;
  stage: number;
  stage_label: string;
  onboarding_complete: boolean;
  todos: TodoItem[];
  shortlisted_count: number;
  locked_count: number;
}

export interface UniversitySearch {
  name: string;
  country: string;
  domain?: string;
  web_page?: string;
  cost_level?: string;
  acceptance_chance?: string;
  fit_reason?: string;
  risks?: string;
  category?: string;
}

export interface UniversityShortlistCreate {
  name: string;
  country: string;
  domain?: string;
  web_page?: string;
  category?: string;
  cost_level?: string;
  acceptance_chance?: string;
  fit_reason?: string;
  risks?: string;
}

export interface UniversityShortlistItem extends UniversityShortlistCreate {
  id: string;
  user_id: string;
  locked: boolean;
}

export interface TodoItem {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  completed: boolean;
  category?: string;
  shortlist_id?: string;
}

export interface ChatMessageItem {
  id: string;
  role: string;
  content: string;
  actions?: unknown[];
}

export interface ApplicationGuidance {
  locked_universities: ({ id: string; name: string; country: string; domain?: string; web_page?: string; category?: string; cost_level?: string; acceptance_chance?: string; fit_reason?: string; risks?: string; locked?: boolean })[];
  required_documents: string[];
  timeline: string[];
  todos: { id: string; title: string; description?: string; completed: boolean; category?: string; shortlist_id?: string }[];
}
