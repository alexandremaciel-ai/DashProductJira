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

export function useJiraProjectMetadata(
  credentials: JiraCredentials | null, 
  projectKey: string | null
) {
  return useQuery({
    queryKey: ["jira", "project-metadata", credentials?.jiraUrl, projectKey],
    queryFn: () => 
      credentials && projectKey 
        ? jiraApi.getProjectMetadata(credentials, projectKey)
        : Promise.resolve(null),
    enabled: !!(credentials && projectKey),
  });
}

export function useJiraStatusCategories(
  credentials: JiraCredentials | null, 
  projectKey: string | null
) {
  return useQuery({
    queryKey: ["jira", "status-categories", credentials?.jiraUrl, projectKey],
    queryFn: () => 
      credentials && projectKey 
        ? jiraApi.getStatusCategories(credentials, projectKey)
        : Promise.resolve(null),
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

    // Debug: Log available issue types
    const issueTypes = [...new Set(issues.map(issue => issue.fields.issuetype.name))];
    console.log("Available issue types:", issueTypes);

    // Debug: Check for story points fields in the first issue
    if (issues.length > 0) {
      const sampleIssue = issues[0];
      const customFields = Object.keys(sampleIssue.fields).filter(key => key.startsWith('customfield_'));
      console.log("Available custom fields:", customFields);
      
      // Check which custom fields might contain story points
      customFields.forEach(field => {
        const value = sampleIssue.fields[field as keyof typeof sampleIssue.fields];
        if (typeof value === 'number' && value > 0) {
          console.log(`Potential story points field ${field}:`, value);
        }
      });
    }

    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const threeWeeksAgo = new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000);

    // Tasks delivered this week (using resolution date OR status done for completed tasks)
    const thisWeekResolved = issues.filter(issue => {
      const isResolved = issue.fields.resolutiondate || 
                        issue.fields.status.statusCategory.key === "done" ||
                        issue.fields.status.statusCategory.name === "Done";
      
      if (!isResolved) return false;
      
      // Use resolution date if available, otherwise use updated date
      const dateToCheck = issue.fields.resolutiondate || issue.fields.updated;
      return new Date(dateToCheck) >= oneWeekAgo;
    });

    const lastWeekResolved = issues.filter(issue => {
      const isResolved = issue.fields.resolutiondate || 
                        issue.fields.status.statusCategory.key === "done" ||
                        issue.fields.status.statusCategory.name === "Done";
      
      if (!isResolved) return false;
      
      const dateToCheck = issue.fields.resolutiondate || issue.fields.updated;
      const checkDate = new Date(dateToCheck);
      return checkDate >= twoWeeksAgo && checkDate < oneWeekAgo;
    });

    const tasksDelivered = thisWeekResolved.length;
    const tasksDeliveredChange = lastWeekResolved.length > 0 
      ? Math.round(((tasksDelivered - lastWeekResolved.length) / lastWeekResolved.length) * 100)
      : tasksDelivered > 0 ? 100 : 0;

    // Velocity (story points) - check for story points field dynamically
    const thisWeekPoints = thisWeekResolved.reduce((sum, issue) => {
      // Try different common story point field names
      const storyPoints = issue.fields.customfield_10016 || 
                         issue.fields.customfield_10002 || 
                         issue.fields.customfield_10004 || 
                         issue.fields.customfield_10008 || 
                         1; // Default to 1 if no story points
      return sum + (typeof storyPoints === 'number' ? storyPoints : 1);
    }, 0);
    
    const lastWeekPoints = lastWeekResolved.reduce((sum, issue) => {
      const storyPoints = issue.fields.customfield_10016 || 
                         issue.fields.customfield_10002 || 
                         issue.fields.customfield_10004 || 
                         issue.fields.customfield_10008 || 
                         1;
      return sum + (typeof storyPoints === 'number' ? storyPoints : 1);
    }, 0);

    const velocity = thisWeekPoints;
    const velocityChange = lastWeekPoints > 0 
      ? Math.round(((velocity - lastWeekPoints) / lastWeekPoints) * 100)
      : velocity > 0 ? 100 : 0;

    // Cycle time - calculate for resolved issues
    const resolvedIssues = issues.filter(issue => 
      issue.fields.resolutiondate || 
      issue.fields.status.statusCategory.key === "done"
    );
    
    const thisWeekCycleTimes = thisWeekResolved.map(issue => {
      const created = new Date(issue.fields.created);
      const resolved = new Date(issue.fields.resolutiondate || issue.fields.updated);
      return (resolved.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
    });

    const lastWeekCycleTimes = lastWeekResolved.map(issue => {
      const created = new Date(issue.fields.created);
      const resolved = new Date(issue.fields.resolutiondate || issue.fields.updated);
      return (resolved.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
    });

    const cycleTime = thisWeekCycleTimes.length > 0 
      ? Math.round((thisWeekCycleTimes.reduce((sum, time) => sum + time, 0) / thisWeekCycleTimes.length) * 10) / 10
      : 0;

    const lastWeekAvgCycleTime = lastWeekCycleTimes.length > 0
      ? lastWeekCycleTimes.reduce((sum, time) => sum + time, 0) / lastWeekCycleTimes.length
      : 0;

    const cycleTimeChange = lastWeekAvgCycleTime > 0 
      ? Math.round(((cycleTime - lastWeekAvgCycleTime) / lastWeekAvgCycleTime) * 100)
      : 0;

    // Bug rate - look for various bug-related issue types
    const bugs = issues.filter(issue => {
      const issueTypeName = issue.fields.issuetype.name.toLowerCase();
      return issueTypeName.includes('bug') || 
             issueTypeName.includes('defeito') || 
             issueTypeName.includes('erro') ||
             issueTypeName.includes('fault') ||
             issueTypeName.includes('incident');
    });

    const thisWeekBugs = thisWeekResolved.filter(issue => {
      const issueTypeName = issue.fields.issuetype.name.toLowerCase();
      return issueTypeName.includes('bug') || 
             issueTypeName.includes('defeito') || 
             issueTypeName.includes('erro') ||
             issueTypeName.includes('fault') ||
             issueTypeName.includes('incident');
    });

    const lastWeekBugs = lastWeekResolved.filter(issue => {
      const issueTypeName = issue.fields.issuetype.name.toLowerCase();
      return issueTypeName.includes('bug') || 
             issueTypeName.includes('defeito') || 
             issueTypeName.includes('erro') ||
             issueTypeName.includes('fault') ||
             issueTypeName.includes('incident');
    });

    const bugRate = issues.length > 0 ? Math.round((bugs.length / issues.length) * 100) : 0;
    
    const thisWeekBugRate = thisWeekResolved.length > 0 
      ? Math.round((thisWeekBugs.length / thisWeekResolved.length) * 100) 
      : 0;
    
    const lastWeekBugRate = lastWeekResolved.length > 0 
      ? Math.round((lastWeekBugs.length / lastWeekResolved.length) * 100) 
      : 0;

    const bugRateChange = lastWeekBugRate > 0 
      ? Math.round(((thisWeekBugRate - lastWeekBugRate) / lastWeekBugRate) * 100)
      : thisWeekBugRate > 0 ? 100 : 0;

    // Debug: Log calculated metrics
    console.log("Calculated metrics:", {
      tasksDelivered,
      tasksDeliveredChange,
      velocity,
      velocityChange,
      cycleTime,
      cycleTimeChange,
      bugRate,
      bugRateChange,
      thisWeekResolved: thisWeekResolved.length,
      lastWeekResolved: lastWeekResolved.length,
      totalIssues: issues.length,
      totalBugs: bugs.length
    });

    setMetrics({
      tasksDelivered,
      tasksDeliveredChange,
      velocity,
      velocityChange,
      cycleTime,
      cycleTimeChange,
      bugRate,
      bugRateChange,
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
        
        // Check if issue is resolved (either has resolution date or is in done status)
        const isResolved = issue.fields.resolutiondate || 
                          issue.fields.status.statusCategory.key === "done" ||
                          issue.fields.status.statusCategory.name === "Done";
        
        if (isResolved) {
          dev.resolvedIssues.push(issue);
          // Try different story points fields
          const storyPoints = issue.fields.customfield_10016 || 
                             issue.fields.customfield_10002 || 
                             issue.fields.customfield_10004 || 
                             issue.fields.customfield_10008 || 
                             1;
          dev.totalPoints += typeof storyPoints === 'number' ? storyPoints : 1;
        }
      }
    });

    const productivityData = Array.from(developerMap.values()).map(dev => {
      const cycleTimes = dev.resolvedIssues.map(issue => {
        const created = new Date(issue.fields.created);
        // Use resolution date if available, otherwise use updated date
        const resolved = new Date(issue.fields.resolutiondate || issue.fields.updated);
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
