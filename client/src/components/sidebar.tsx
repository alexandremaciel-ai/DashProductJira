import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import type { DashboardFilters, JiraSprint, JiraIssue, JiraCredentials } from "@/types/jira";
import { useJiraStatusCategories, useProjectMembers } from "@/hooks/use-jira-data";

interface SidebarProps {
  filters: DashboardFilters;
  onFiltersChange: (filters: DashboardFilters) => void;
  sprints: JiraSprint[];
  issues: JiraIssue[];
  allIssues?: JiraIssue[];
  credentials: JiraCredentials;
  projectKey: string;
  quickStats: {
    activeIssues: number;
    teamMembers: number;
    avgCycleTime: number;
  };
}

export function Sidebar({ filters, onFiltersChange, sprints, issues, allIssues, credentials, projectKey, quickStats }: SidebarProps) {
  const timePeriods = [
    { value: "week", label: "This Week" },
    { value: "month", label: "This Month" },
    { value: "quarter", label: "Quarter" },
    { value: "custom", label: "Custom" },
  ] as const;

  // Get dynamic status categories and issue types
  const { data: statusData } = useJiraStatusCategories(credentials, projectKey);
  const { data: projectMembers } = useProjectMembers(credentials, projectKey);
  
  // Get unique issue types from dynamic data or fallback to issues
  const issueTypes = statusData?.issueTypes.map(type => type.name) || 
    (issues && issues.length > 0 
      ? Array.from(new Set(issues.map(issue => issue.fields.issuetype.name)))
      : ["Story", "Bug", "Task", "Epic"]); // fallback default types

  // Use project members from API to maintain complete list regardless of filters
  const teamMembers = projectMembers && projectMembers.length > 0 
    ? projectMembers.map(member => ({
        accountId: member.accountId,
        displayName: member.displayName,
        emailAddress: member.emailAddress || member.accountId,
      }))
    : Array.from(
        new Map(
          (allIssues || issues)
            .filter(issue => issue.fields.assignee) // Only issues with assignees
            .map(issue => [
              issue.fields.assignee!.emailAddress || issue.fields.assignee!.displayName,
              {
                accountId: issue.fields.assignee!.emailAddress || issue.fields.assignee!.displayName,
                displayName: issue.fields.assignee!.displayName,
                emailAddress: issue.fields.assignee!.emailAddress || "",
              }
            ])
        ).values()
      );

  const handleTimePeriodChange = (period: DashboardFilters["timePeriod"]) => {
    onFiltersChange({ ...filters, timePeriod: period });
  };

  const handleIssueTypeChange = (issueType: string, checked: boolean) => {
    const newIssueTypes = checked 
      ? [...filters.issueTypes, issueType]
      : filters.issueTypes.filter(type => type !== issueType);
    
    onFiltersChange({ ...filters, issueTypes: newIssueTypes });
  };

  return (
    <aside className="w-80 bg-white border-r border-gray-200 min-h-screen">
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Filters & Analytics</h2>
        
        {/* Time Period Filter */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">Time Period</label>
          <div className="grid grid-cols-2 gap-2">
            {timePeriods.map((period) => (
              <Button
                key={period.value}
                variant={filters.timePeriod === period.value ? "default" : "outline"}
                size="sm"
                onClick={() => handleTimePeriodChange(period.value)}
                className={filters.timePeriod === period.value ? 
                  "bg-blue-600 text-white" : 
                  "text-gray-600 bg-gray-50 hover:bg-gray-100"
                }
              >
                {period.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Sprint Filter */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">Sprint</label>
          <Select 
            value={filters.sprint} 
            onValueChange={(value) => onFiltersChange({ ...filters, sprint: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Sprints" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sprints</SelectItem>
              {sprints && sprints.length > 0 ? sprints.map((sprint) => (
                <SelectItem key={sprint.id} value={sprint.id.toString()}>
                  {sprint.name} {sprint.state === "active" ? "(Current)" : ""}
                </SelectItem>
              )) : (
                <SelectItem value="no-sprints" disabled>No sprints found</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Team Filter */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">Team/Developer</label>
          <Select 
            value={filters.assignee} 
            onValueChange={(value) => onFiltersChange({ ...filters, assignee: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Developers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Developers</SelectItem>
              {teamMembers && teamMembers.length > 0 ? teamMembers
                .filter(member => member.accountId && (member.emailAddress || member.displayName))
                .map((member) => (
                <SelectItem 
                  key={member.accountId} 
                  value={member.emailAddress || member.accountId}
                >
                  {member.displayName || member.emailAddress || "Unknown User"}
                </SelectItem>
              )) : (
                <SelectItem value="no-members" disabled>No team members found</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Issue Type Filter */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">Issue Type</label>
          <div className="space-y-2">
            {issueTypes && issueTypes.length > 0 ? issueTypes
              .filter(issueType => issueType && issueType.trim().length > 0)
              .map((issueType) => (
              <div key={issueType} className="flex items-center space-x-2">
                <Checkbox
                  id={issueType}
                  checked={filters.issueTypes.includes(issueType)}
                  onCheckedChange={(checked) => 
                    handleIssueTypeChange(issueType, checked as boolean)
                  }
                />
                <label htmlFor={issueType} className="text-sm text-gray-600">
                  {issueType}
                </label>
              </div>
            )) : (
              <div className="text-sm text-gray-500">No issue types found</div>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <Card className="bg-gray-50">
          <CardContent className="p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Quick Stats</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Active Issues</span>
                <span className="font-medium text-gray-900">{quickStats.activeIssues}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Team Members</span>
                <span className="font-medium text-gray-900">{quickStats.teamMembers}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Avg. Cycle Time</span>
                <span className="font-medium text-gray-900">{quickStats.avgCycleTime} days</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </aside>
  );
}
