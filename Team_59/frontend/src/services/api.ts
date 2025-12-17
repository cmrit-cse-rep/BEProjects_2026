const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

interface PredictMedicalImageResponse {
  class_name: string;
  confidence: number;
  explanation_url?: string;
  [key: string]: any;
}

// -------- Medical image prediction --------

export async function predictMedicalImage(
  file: File,
  modelType: 'mobilenetv2' | 'hybrid_cnn_vit' = 'mobilenetv2',
  generateExplanation = true
): Promise<PredictMedicalImageResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const url = `${API_BASE_URL}/api/medical/predict?generate_explanation=${generateExplanation}&model_type=${modelType}`;

  const response = await fetch(url, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Prediction API error: ${errorText}`);
  }

  const data = await response.json();
  return data as PredictMedicalImageResponse;
}

// -------- Auth API types --------

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface RegisterRequest {
  email: string;
  full_name?: string;
  password: string;
  role?: string;
}

export interface UserMeResponse {
  id: number;
  email: string;
  full_name?: string | null;
  role: string;
  is_active: boolean;
}

// -------- Auth API helpers --------

export async function apiLogin(email: string, password: string): Promise<LoginResponse> {
  const url = `${API_BASE_URL}/api/auth/login`;

  const body = new URLSearchParams();
  body.append('username', email);
  body.append('password', password);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Login failed');
  }

  return (await response.json()) as LoginResponse;
}

export async function apiRegister(payload: RegisterRequest): Promise<UserMeResponse> {
  const url = `${API_BASE_URL}/api/auth/register`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Registration failed');
  }

  return (await response.json()) as UserMeResponse;
}

export async function apiGetCurrentUser(token: string): Promise<UserMeResponse> {
  const url = `${API_BASE_URL}/api/auth/me`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Failed to fetch current user');
  }

  return (await response.json()) as UserMeResponse;
}

// -------- Instructor & Lesson helpers --------

export async function apiGetInstructorCourses(token: string) {
  const url = `${API_BASE_URL}/api/instructor/courses`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || 'Failed to load instructor courses');
  }

  return res.json();
}

export async function apiGetInstructorCourseStudents(
  courseId: number,
  token: string,
) {
  const url = `${API_BASE_URL}/api/instructor/courses/${courseId}/students`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || 'Failed to load students');
  }

  return res.json();
}

export async function apiGetCourseLessons(courseId: number, token: string) {
  const url = `${API_BASE_URL}/api/courses/${courseId}/lessons`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || 'Failed to load lessons');
  }

  return res.json();
}
