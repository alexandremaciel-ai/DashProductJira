import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import type { 
  JiraCredentials, 
  JiraProject, 
  JiraIssue, 
  JiraSprint,
  ProductivityMetrics,
  DeveloperProductivity,
  DashboardFilters,
  AIInsights
} from "@/types/jira";
import { jiraApi } from "@/lib/jira-api";

export function useJiraProjects(credentials: JiraCredentials | null) {
  return useQuery({
    queryKey: ["jira", "projects", credentials?.jiraUrl],
    queryFn: () => credentials ? jiraApi.getProjects(credentials) : Promise.resolve([]),
    enabled: !!credentials,
  });
}

export function useJiraIssues(
  credentials: JiraCredentials | null, 
  projectKey: string | null,
  filters?: DashboardFilters
) {
  return useQuery({
    queryKey: ["jira", "issues", credentials?.jiraUrl, projectKey, filters],
    queryFn: () => 
      credentials && projectKey 
        ? jiraApi.getIssues(credentials, projectKey, filters)
        : Promise.resolve({ issues: [], total: 0 }),
    enabled: !!(credentials && projectKey),
  });
}

export function useJiraSprints(
  credentials: JiraCredentials | null, 
  projectKey: string | null
) {
  return useQuery({
    queryKey: ["jira", "sprints", credentials?.jiraUrl, projectKey],
    queryFn: () => 
      credentials && projectKey 
        ? jiraApi.getSprints(credentials, projectKey)
        : Promise.resolve([]),
    enabled: !!(credentials && projectKey),
  });
}

export function useProductivityMetrics(issues: JiraIssue[]) {
  const [metrics, setMetrics] = useState<ProductivityMetrics>({
    tasksDelivered: 0,
    tasksDeliveredChange: 0,
    velocity: 0,
    velocityChange: 0,
    cycleTime: 0,
    cycleTimeChange: 0,
    bugRate: 0,
    bugRateChange: 0,
  });

  const calculateMetrics = useCallback(() => {
    if (!issues || issues.length === 0) return;

    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    // Tasks delivered this week
    const thisWeekResolved = issues.filter(issue => 
      issue.fields.resolutiondate && 
      new Date(issue.fields.resolutiondate) >= oneWeekAgo
    );

    const lastWeekResolved = issues.filter(issue => 
      issue.fields.resolutiondate && 
      new Date(issue.fields.resolutiondate) >= twoWeeksAgo &&
      new Date(issue.fields.resolutiondate) < oneWeekAgo
    );

    const tasksDelivered = thisWeekResolved.length;
    const tasksDeliveredChange = lastWeekResolved.length > 0 
      ? Math.round(((tasksDelivered - lastWeekResolved.length) / lastWeekResolved.length) * 100)
      : 0;

    // Velocity (story points)
    const thisWeekPoints = thisWeekResolved.reduce((sum, issue) => 
      sum + (issue.fields.customfield_10016 || 1), 0
    );
    const lastWeekPoints = lastWeekResolved.reduce((sum, issue) => 
      sum + (issue.fields.customfield_10016 || 1), 0
    );

    const velocity = thisWeekPoints;
    const velocityChange = lastWeekPoints > 0 
      ? Math.round(((velocity - lastWeekPoints) / lastWeekPoints) * 100)
      : 0;

    // Cycle time
    const resolvedIssues = issues.filter(issue => issue.fields.resolutiondate);
    const cycleTimes = resolvedIssues.map(issue => {
      const created = new Date(issue.fields.created);
      const resolved = new Date(issue.fields.resolutiondate!);
      return (resolved.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
    });

    const cycleTime = cycleTimes.length > 0 
      ? Math.round((cycleTimes.reduce((sum, time) => sum + time, 0) / cycleTimes.length) * 10) / 10
      : 0;

    // Bug rate
    const bugs = issues.filter(issue => 
      issue.fields.issuetype.name.toLowerCase().includes('bug')
    );
    const bugRate = issues.length > 0 ? Math.round((bugs.length / issues.length) * 100) : 0;

    setMetrics({
      tasksDelivered,
      tasksDeliveredChange,
      velocity,
      velocityChange,
      cycleTime,
      cycleTimeChange: -15, // Mock change for now
      bugRate,
      bugRateChange: -3, // Mock change for now
    });
  }, [issues]);

  useEffect(() => {
    calculateMetrics();
  }, [calculateMetrics]);

  return metrics;
}

export function useDeveloperProductivity(issues: JiraIssue[]): DeveloperProductivity[] {
  const [productivity, setProductivity] = useState<DeveloperProductivity[]>([]);

  useEffect(() => {
    if (!issues || issues.length === 0) return;

    const developerMap = new Map<string, {
      name: string;
      email: string;
      issues: JiraIssue[];
      resolvedIssues: JiraIssue[];
      totalPoints: number;
    }>();

    issues.forEach(issue => {
      if (issue.fields.assignee) {
        const key = issue.fields.assignee.emailAddress;
        if (!developerMap.has(key)) {
          developerMap.set(key, {
            name: issue.fields.assignee.displayName,
            email: issue.fields.assignee.emailAddress,
            issues: [],
            resolvedIssues: [],
            totalPoints: 0,
          });
        }

        const dev = developerMap.get(key)!;
        dev.issues.push(issue);
        
        if (issue.fields.resolutiondate) {
          dev.resolvedIssues.push(issue);
          dev.totalPoints += issue.fields.customfield_10016 || 1;
        }
      }
    });

    const productivityData = Array.from(developerMap.values()).map(dev => {
      const cycleTimes = dev.resolvedIssues.map(issue => {
        const created = new Date(issue.fields.created);
        const resolved = new Date(issue.fields.resolutiondate!);
        return (resolved.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
      });

      const avgCycleTime = cycleTimes.length > 0 
        ? Math.round((cycleTimes.reduce((sum, time) => sum + time, 0) / cycleTimes.length) * 10) / 10
        : 0;

      return {
        name: dev.name,
        email: dev.email,
        issuesResolved: dev.resolvedIssues.length,
        storyPoints: dev.totalPoints,
        avgCycleTime,
      };
    });

    setProductivity(productivityData.sort((a, b) => b.issuesResolved - a.issuesResolved));
  }, [issues]);

  return productivity;
}

export function useAIInsights(
  metrics: ProductivityMetrics,
  isEnabled: boolean
) {
  return useQuery({
    queryKey: ["ai", "insights", metrics, isEnabled],
    queryFn: () => jiraApi.getAIInsights(metrics, {}),
    enabled: isEnabled && metrics.tasksDelivered > 0,
  });
}
