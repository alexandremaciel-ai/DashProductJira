import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { CustomDatePicker } from "@/components/custom-date-picker";
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
    { value: "week", label: "Esta Semana" },
    { value: "month", label: "Este Mês" },
    { value: "quarter", label: "Trimestre" },
    { value: "custom", label: "Personalizado" },
  ] as const;

  // Get dynamic status categories and issue types
  const { data: statusData } = useJiraStatusCategories(credentials, projectKey);
  const { data: projectMembers } = useProjectMembers(credentials, projectKey);
  
  // Get unique issue types from dynamic data or fallback to issues
  const issueTypes = statusData?.issueTypes.map(type => type.name) || 
    (issues && issues.length > 0 
      ? Array.from(new Set(issues.map(issue => issue.fields.issuetype.name)))
      : ["Story", "Bug", "Task", "Epic"]); // fallback default types

  // Extract unique assignees from current issues (same as Kanban)
  const teamMembers = Array.from(
    new Map(
      issues
        .filter(issue => issue.fields.assignee) // Only issues with assignees
        .map(issue => {
          const assignee = issue.fields.assignee!;
          return [
            assignee.displayName, // Use displayName as key to avoid duplicates
            {
              accountId: assignee.accountId, // Use accountId for filtering (Jira's internal ID)
              displayName: assignee.displayName,
              emailAddress: assignee.emailAddress || "",
            }
          ];
        })
    ).values()
  );

  const handleTimePeriodChange = (period: DashboardFilters["timePeriod"]) => {
    onFiltersChange({ ...filters, timePeriod: period });
  };

  const handleCustomDateChange = (startDate?: string, endDate?: string) => {
    onFiltersChange({ 
      ...filters, 
      customStartDate: startDate,
      customEndDate: endDate,
      timePeriod: "custom" // Automatically set to custom when dates are selected
    });
  };

  const handleClearCustomDates = () => {
    onFiltersChange({ 
      ...filters, 
      customStartDate: undefined,
      customEndDate: undefined,
      timePeriod: "week" // Reset to week when clearing custom dates
    });
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
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Filtros e Análises</h2>
        
        {/* Time Period Filter */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">Período</label>
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
          
          {/* Custom Date Picker */}
          {filters.timePeriod === "custom" && (
            <div className="mt-3">
              <label className="block text-xs font-medium text-gray-600 mb-2">Período Personalizado</label>
              <CustomDatePicker
                startDate={filters.customStartDate}
                endDate={filters.customEndDate}
                onDateChange={handleCustomDateChange}
                onClear={handleClearCustomDates}
              />
            </div>
          )}
        </div>

        {/* Sprint Filter */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">Sprint</label>
          <Select 
            value={filters.sprint} 
            onValueChange={(value) => onFiltersChange({ ...filters, sprint: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todos os Sprints" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Sprints</SelectItem>
              {sprints && sprints.length > 0 ? sprints.map((sprint) => (
                <SelectItem key={sprint.id} value={sprint.id.toString()}>
                  {sprint.name} {sprint.state === "active" ? "(Atual)" : ""}
                </SelectItem>
              )) : (
                <SelectItem value="no-sprints" disabled>Nenhum sprint encontrado</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Team Filter */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">Equipe/Desenvolvedor</label>
          <Select 
            value={filters.assignee} 
            onValueChange={(value) => onFiltersChange({ ...filters, assignee: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todos os Desenvolvedores" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Desenvolvedores</SelectItem>
              {teamMembers && teamMembers.length > 0 ? teamMembers
                .filter(member => member.accountId && member.displayName)
                .map((member) => (
                <SelectItem 
                  key={member.accountId} 
                  value={member.accountId}
                >
                  {member.displayName}
                </SelectItem>
              )) : (
                <SelectItem value="no-members" disabled>Nenhum membro da equipe encontrado</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Issue Type Filter */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">Tipo de Issue</label>
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
              <div className="text-sm text-gray-500">Nenhum tipo de issue encontrado</div>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <Card className="bg-gray-50">
          <CardContent className="p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Estatísticas Rápidas</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Issues Ativas</span>
                <span className="font-medium text-gray-900">{quickStats.activeIssues}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Membros da Equipe</span>
                <span className="font-medium text-gray-900">{quickStats.teamMembers}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tempo Médio de Ciclo</span>
                <span className="font-medium text-gray-900">{quickStats.avgCycleTime} dias</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </aside>
  );
}
