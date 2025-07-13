import axios from "axios";
import type { 
  JiraCredentials, 
  JiraProject, 
  JiraIssue, 
  JiraSprint,
  DashboardFilters,
  AIInsights 
} from "@/types/jira";

const api = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

export const jiraApi = {
  async authenticate(credentials: JiraCredentials) {
    const response = await api.post("/jira/auth", credentials);
    return response.data;
  },

  async getProjects(credentials: JiraCredentials): Promise<JiraProject[]> {
    const response = await api.post("/jira/projects", credentials);
    return response.data;
  },

  async getIssues(
    credentials: JiraCredentials, 
    projectKey: string, 
    filters?: DashboardFilters
  ): Promise<{ issues: JiraIssue[]; total: number }> {
    const response = await api.post("/jira/issues", {
      ...credentials,
      projectKey,
      filters,
    });
    return response.data;
  },

  async getSprints(credentials: JiraCredentials, projectKey: string): Promise<JiraSprint[]> {
    const response = await api.post("/jira/sprints", {
      ...credentials,
      projectKey,
    });
    return response.data;
  },

  async getAIInsights(metrics: any, projectData: any): Promise<AIInsights> {
    const response = await api.post("/ai/insights", {
      metrics,
      projectData,
    });
    return response.data;
  },

  async getProjectMetadata(credentials: JiraCredentials, projectKey: string): Promise<any> {
    const response = await api.post("/jira/project-metadata", {
      ...credentials,
      projectKey,
    });
    return response.data;
  },

  async getStatusCategories(credentials: JiraCredentials, projectKey: string): Promise<any> {
    const response = await api.post("/jira/status-categories", {
      ...credentials,
      projectKey,
    });
    return response.data;
  },

  async getProjectMembers(credentials: JiraCredentials, projectKey: string): Promise<any[]> {
    const response = await api.post("/jira/project-members", {
      ...credentials,
      projectKey,
    });
    return response.data;
  },
};
