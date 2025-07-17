import type { JiraIssue } from '@/types/jira';
import type { CardStatusConfig } from '@/types/card-config';

export function calculateCardMetric(
  issues: JiraIssue[],
  config: CardStatusConfig
): number {
  return issues.filter(issue => {
    const statusName = issue.fields.status.name.toLowerCase();
    const statusCategory = issue.fields.status.statusCategory.name;
    
    // Check if issue matches any of the configured status names
    const matchesStatusName = config.statusNames.length === 0 || 
      config.statusNames.some(name => statusName.includes(name.toLowerCase()));
    
    // Check if issue matches any of the configured status categories
    const matchesStatusCategory = config.statusCategories.length === 0 || 
      config.statusCategories.some(category => statusCategory === category);
    
    // For total card, we want to include all issues if no specific filters are set
    if (config.cardId === 'total') {
      return config.statusNames.length === 0 && config.statusCategories.length > 0 
        ? matchesStatusCategory 
        : matchesStatusName || matchesStatusCategory;
    }
    
    // For other cards, both name and category filters should be applied
    return matchesStatusName || matchesStatusCategory;
  }).length;
}

export function getStatusSummary(
  issues: JiraIssue[],
  config: CardStatusConfig
): {
  matchingIssues: JiraIssue[];
  statusBreakdown: Record<string, number>;
} {
  const matchingIssues = issues.filter(issue => {
    const statusName = issue.fields.status.name.toLowerCase();
    const statusCategory = issue.fields.status.statusCategory.name;
    
    const matchesStatusName = config.statusNames.length === 0 || 
      config.statusNames.some(name => statusName.includes(name.toLowerCase()));
    
    const matchesStatusCategory = config.statusCategories.length === 0 || 
      config.statusCategories.some(category => statusCategory === category);
    
    if (config.cardId === 'total') {
      return config.statusNames.length === 0 && config.statusCategories.length > 0 
        ? matchesStatusCategory 
        : matchesStatusName || matchesStatusCategory;
    }
    
    return matchesStatusName || matchesStatusCategory;
  });

  const statusBreakdown: Record<string, number> = {};
  matchingIssues.forEach(issue => {
    const statusName = issue.fields.status.name;
    statusBreakdown[statusName] = (statusBreakdown[statusName] || 0) + 1;
  });

  return {
    matchingIssues,
    statusBreakdown
  };
}