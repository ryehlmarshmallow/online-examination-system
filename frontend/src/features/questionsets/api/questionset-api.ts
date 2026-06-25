import { apiClient } from "@/shared/lib/apiClient";

export interface QuestionRequest {
  prompt: string;
  type: string;
  points: number;
  content: Record<string, unknown>;
  rubric: Record<string, unknown>;
}

export interface QuestionGroupRequest {
  prompt: string | null;
  isGroup: boolean;
  questions: QuestionRequest[];
}

export interface QuestionSetDetailResponse {
  id: string;
  name: string;
  questionGroups: QuestionGroupRequest[];
}

export async function getTemplateDetail(id: string): Promise<QuestionSetDetailResponse> {
  const response = await apiClient.get<QuestionSetDetailResponse>(`/api/templates/${id}`);
  return response.data;
}

export async function updateTemplateQuestions(id: string, questionGroups: QuestionGroupRequest[]): Promise<void> {
  await apiClient.put(`/api/templates/${id}/questions`, { questionGroups });
}

export async function getPoolDetail(id: string): Promise<QuestionSetDetailResponse> {
  const response = await apiClient.get<QuestionSetDetailResponse>(`/api/pools/${id}`);
  return response.data;
}

export async function updatePoolQuestions(id: string, questionGroups: QuestionGroupRequest[]): Promise<void> {
  await apiClient.put(`/api/pools/${id}/questions`, { questionGroups });
}

export type SaveQuestionSetAsPayload = {
  targetDomain: "TEMPLATE" | "POOL"
  parentId: string | null
  name: string
}

export type GenerateTemplateFromPoolPayload = {
  name: string
  parentId: string | null
  randomCount: number | null
}

export type GenerateExamFromPoolPayload = {
  classroomId: string
  examTitle: string
  questionGroupCount: number
  startTime: string | null
  endTime: string | null
  duration: number | null
  maxAttempts: number | null
}

export async function saveTemplateAs(id: string, payload: SaveQuestionSetAsPayload): Promise<{ id: string }> {
  const response = await apiClient.post<{ id: string }>(`/api/templates/${id}/save-as`, payload)
  return response.data;
}

export async function savePoolAs(id: string, payload: SaveQuestionSetAsPayload): Promise<{ id: string }> {
  const response = await apiClient.post<{ id: string }>(`/api/pools/${id}/save-as`, payload)
  return response.data;
}

export async function generateTemplateFromPool(id: string, payload: GenerateTemplateFromPoolPayload): Promise<{
  id: string
}> {
  const response = await apiClient.post<{ id: string }>(`/api/pools/${id}/generate-exam-template`, payload)
  return response.data;
}

export async function generateRandomExamFromPool(id: string, payload: GenerateExamFromPoolPayload): Promise<{
  id: string
}> {
  const response = await apiClient.post<{ id: string }>(`/api/pools/${id}/generate-random-exam`, payload)
  return response.data;
}

