export interface JiraCredentials {
  jiraUrl: string;
  username: string;
  apiToken: string;
}

export interface JiraProject {
  id: string;
  key: string;
  name: string;
  avatarUrls?: {
    "48x48": string;
  };
  projectTypeKey: string;
  issueTypes?: JiraIssueType[];
}

export interface JiraIssue {
  id: string;
  key: string;
  fields: {
    summary: string;
    status: {
      name: string;
      statusCategory: {
        name: string;
        colorName: string;
      };
    };
    assignee?: {
      displayName: string;
      emailAddress: string;
    };
    created: string;
    updated: string;
    resolutiondate?: string;
    issuetype: {
      name: string;
      iconUrl: string;
    };
    customfield_10016?: number; // Story points
  };
}

export interface JiraIssueType {
  id: string;
  name: string;
  iconUrl: string;
  subtask: boolean;
}

export interface JiraSprint {
  id: number;
  name: string;
  state: "active" | "closed" | "future";
  startDate?: string;
  endDate?: string;
  completeDate?: string;
}

export interface ProductivityMetrics {
  tasksDelivered: number;
  tasksDeliveredChange: number;
  velocity: number;
  velocityChange: number;
  cycleTime: number;
  cycleTimeChange: number;
  bugRate: number;
  bugRateChange: number;
}

export interface DeveloperProductivity {
  name: string;
  email: string;
  issuesResolved: number;
  storyPoints: number;
  avgCycleTime: number;
}

export interface AIInsights {
  performance: string;
  predictions: string;
  recommendations: string;
}

export interface DashboardFilters {
  timePeriod: "week" | "month" | "quarter" | "custom";
  sprint?: string;
  assignee?: string;
  issueTypes: string[];
}
