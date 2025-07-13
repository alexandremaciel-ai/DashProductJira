import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, BarChart3, Columns3, CheckCircle, Clock, Rocket } from "lucide-react";

import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";
import { KanbanBoard } from "@/components/kanban-board";
import { CompletionCharts } from "@/components/completion-charts";
import { MetricsCard } from "@/components/metrics-card";

import { useJiraAuth } from "@/hooks/use-jira-auth";
import { useJiraIssues, useJiraSprints, useProjectMembers } from "@/hooks/use-jira-data";

import type { JiraProject, DashboardFilters } from "@/types/jira";

export default function KanbanPage() {
  const [, setLocation] = useLocation();
  const { credentials, logout, loadStoredCredentials } = useJiraAuth();
  const [selectedProject, setSelectedProject] = useState<JiraProject | null>(null);
  const [aiEnabled, setAIEnabled] = useState(false);

  // Usar os mesmos filtros que o dashboard - vamos criar um estado compartilhado
  const [filters, setFilters] = useState<DashboardFilters>({
    timePeriod: "all", // Padrão agora é "Todo Período"
    sprint: undefined,
    assignee: undefined,
    issueTypes: [],
    customStartDate: undefined,
    customEndDate: undefined,
  });

  // Load stored data on mount
  useEffect(() => {
    if (!credentials) {
      const storedCreds = loadStoredCredentials();
      if (!storedCreds) {
        setLocation("/");
        return;
      }
    }

    const storedProject = sessionStorage.getItem("selectedProject");
    if (storedProject) {
      try {
        setSelectedProject(JSON.parse(storedProject));
      } catch {
        setLocation("/projects");
      }
    } else {
      setLocation("/projects");
    }
  }, [credentials, loadStoredCredentials, setLocation]);

  // Fetch issues data with current filters
  const { data: issuesData, isLoading: issuesLoading } = useJiraIssues(
    credentials, 
    selectedProject?.key || null, 
    filters
  );
  
  // Fetch sprints and project members
  const { data: sprints } = useJiraSprints(credentials, selectedProject?.key || null);
  const { data: projectMembers } = useProjectMembers(credentials, selectedProject?.key || null);

  const issues = issuesData?.issues || [];

  // Event handlers
  const handleSwitchProject = () => setLocation("/projects");
  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  // Statistics with flexible status mapping
  const getStatsByStatus = (statusCategory: string) => {
    return issues.filter(issue => {
      const statusCategoryName = issue.fields.status.statusCategory.name;
      const statusName = issue.fields.status.name.toLowerCase();
      
      if (statusCategory === "To Do") {
        return statusCategoryName === "To Do" || 
               statusCategoryName === "new" ||
               statusName.includes("aberto") ||
               statusName.includes("novo") ||
               statusName.includes("backlog");
      } else if (statusCategory === "In Progress") {
        return statusCategoryName === "In Progress" || 
               statusCategoryName === "indeterminate" ||
               statusName.includes("progresso") ||
               statusName.includes("progress") ||
               statusName.includes("desenvolvimento") ||
               statusName.includes("em andamento");
      } else if (statusCategory === "Done") {
        return statusCategoryName === "Done" || 
               statusCategoryName === "complete" ||
               statusName.includes("concluído") ||
               statusName.includes("done") ||
               statusName.includes("fechado") ||
               statusName.includes("resolvido");
      }
      return false;
    });
  };

  // Helper function to get tasks created in the current period (same logic as dashboard)
  const getTasksCreatedInPeriod = (allIssues: JiraIssue[], filters: DashboardFilters) => {
    const now = new Date();
    let startDate: Date;

    switch (filters.timePeriod) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
        break;
      case 'month':
        startDate = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000); // 4 weeks ago
        break;
      case 'quarter':
        startDate = new Date(now.getTime() - 84 * 24 * 60 * 60 * 1000); // 12 weeks ago
        break;
      case 'custom':
        if (filters.customStartDate) {
          startDate = new Date(filters.customStartDate);
        } else {
          return allIssues; // If no custom start date, return all
        }
        break;
      case 'all':
      default:
        return allIssues; // Return all tasks for "Todo Período"
    }

    return allIssues.filter(issue => {
      const createdDate = new Date(issue.fields.created);
      if (filters.timePeriod === 'custom' && filters.customEndDate) {
        const endDate = new Date(filters.customEndDate);
        return createdDate >= startDate && createdDate <= endDate;
      }
      return createdDate >= startDate;
    });
  };

  // Get tasks created in the current period for consistency with dashboard
  const tasksCreatedInPeriod = getTasksCreatedInPeriod(issues, filters);

  const stats = {
    total: tasksCreatedInPeriod.length, // Total baseado em criação no período
    todo: tasksCreatedInPeriod.filter(issue => {
      const statusCategoryName = issue.fields.status.statusCategory.name;
      const statusName = issue.fields.status.name.toLowerCase();
      
      return statusCategoryName === "To Do" || 
             statusCategoryName === "new" ||
             statusName.includes("aberto") ||
             statusName.includes("novo") ||
             statusName.includes("backlog");
    }).length,
    inProgress: tasksCreatedInPeriod.filter(issue => {
      const statusCategoryName = issue.fields.status.statusCategory.name;
      const statusName = issue.fields.status.name.toLowerCase();
      
      return statusCategoryName === "In Progress" || 
             statusCategoryName === "indeterminate" ||
             statusName.includes("progresso") ||
             statusName.includes("progress") ||
             statusName.includes("desenvolvimento") ||
             statusName.includes("em andamento");
    }).length,
    done: tasksCreatedInPeriod.filter(issue => {
      const statusCategoryName = issue.fields.status.statusCategory.name;
      const statusName = issue.fields.status.name.toLowerCase();
      
      return statusCategoryName === "Done" || 
             statusCategoryName === "complete" ||
             statusName.includes("concluído") ||
             statusName.includes("done") ||
             statusName.includes("fechado") ||
             statusName.includes("resolvido");
    }).length,
    thisWeek: tasksCreatedInPeriod.filter(i => {
      if (!i.fields.resolutiondate) return false;
      const resolved = new Date(i.fields.resolutiondate);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return resolved >= weekAgo;
    }).length
  };

  // Helper function to get tasks from previous period for comparison (same logic as dashboard)
  const getTasksFromPreviousPeriod = (allIssues: JiraIssue[], filters: DashboardFilters) => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    switch (filters.timePeriod) {
      case 'week':
        startDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000); // 14 days ago
        endDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
        break;
      case 'month':
        startDate = new Date(now.getTime() - 56 * 24 * 60 * 60 * 1000); // 8 weeks ago
        endDate = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000); // 4 weeks ago
        break;
      case 'quarter':
        startDate = new Date(now.getTime() - 168 * 24 * 60 * 60 * 1000); // 24 weeks ago
        endDate = new Date(now.getTime() - 84 * 24 * 60 * 60 * 1000); // 12 weeks ago
        break;
      case 'custom':
      case 'all':
      default:
        return []; // No comparison for custom or all periods
    }

    return allIssues.filter(issue => {
      const createdDate = new Date(issue.fields.created);
      return createdDate >= startDate && createdDate <= endDate;
    });
  };

  // Calculate percentage change
  const calculatePercentageChange = (current: number, previous: number): number => {
    if (previous === 0) {
      return current > 0 ? 100 : 0;
    }
    return Math.round(((current - previous) / previous) * 100);
  };

  // Get previous period data for comparisons
  const previousPeriodTasks = getTasksFromPreviousPeriod(issues, filters);

  // Calculate previous period stats
  const previousStats = {
    total: previousPeriodTasks.length,
    todo: previousPeriodTasks.filter(issue => {
      const statusCategoryName = issue.fields.status.statusCategory.name;
      const statusName = issue.fields.status.name.toLowerCase();
      
      return statusCategoryName === "To Do" || 
             statusCategoryName === "new" ||
             statusName.includes("aberto") ||
             statusName.includes("novo") ||
             statusName.includes("backlog");
    }).length,
    inProgress: previousPeriodTasks.filter(issue => {
      const statusCategoryName = issue.fields.status.statusCategory.name;
      const statusName = issue.fields.status.name.toLowerCase();
      
      return statusCategoryName === "In Progress" || 
             statusCategoryName === "indeterminate" ||
             statusName.includes("progresso") ||
             statusName.includes("progress") ||
             statusName.includes("desenvolvimento") ||
             statusName.includes("em andamento");
    }).length,
    done: previousPeriodTasks.filter(issue => {
      const statusCategoryName = issue.fields.status.statusCategory.name;
      const statusName = issue.fields.status.name.toLowerCase();
      
      return statusCategoryName === "Done" || 
             statusCategoryName === "complete" ||
             statusName.includes("concluído") ||
             statusName.includes("done") ||
             statusName.includes("fechado") ||
             statusName.includes("resolvido");
    }).length
  };

  // Calculate percentage changes
  const changes = {
    total: calculatePercentageChange(stats.total, previousStats.total),
    todo: calculatePercentageChange(stats.todo, previousStats.todo),
    inProgress: calculatePercentageChange(stats.inProgress, previousStats.inProgress),
    done: calculatePercentageChange(stats.done, previousStats.done)
  };

  // Helper function to get period description
  const getPeriodDescription = (timePeriod: string) => {
    switch (timePeriod) {
      case 'week': return 'esta semana';
      case 'month': return 'este mês';
      case 'quarter': return 'este trimestre';
      case 'custom': return 'no período personalizado';
      case 'all':
      default: return 'em todo período';
    }
  };

  // Debug: Log para verificar se os números estão corretos
  console.log("Kanban Stats Debug:", {
    filter: filters.timePeriod,
    totalCreatedInPeriod: tasksCreatedInPeriod.length,
    totalFilteredByAPI: issues.length,
    totalAllIssues: allIssues?.length || 0,
    todoCount: stats.todo,
    inProgressCount: stats.inProgress,
    doneCount: stats.done,
    thisWeekCount: stats.thisWeek,
    changes: changes,
    cardLimit: Math.min(stats.total, 100) // Investigate if there's a limit
  });

  if (!credentials || !selectedProject) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        projectName={selectedProject.name}
        onSwitchProject={handleSwitchProject}
        onLogout={handleLogout}
        aiEnabled={aiEnabled}
        onAIToggle={setAIEnabled}
      />

      <div className="max-w-7xl mx-auto p-6">
        {/* Navigation */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => setLocation("/dashboard")}
              className="text-gray-600 hover:text-gray-700"
            >
              ← Voltar ao Dashboard
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">
              Quadro Kanban - {selectedProject.name}
            </h1>
          </div>
        </div>

        {issuesLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="animate-spin" size={32} />
            <span className="ml-2">Carregando tarefas...</span>
          </div>
        ) : (
          <>
            {/* Advanced Statistics Cards - Same as Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <MetricsCard
                title="Total de Tarefas"
                value={stats.total}
                change={changes.total}
                icon={<CheckCircle className="text-blue-600" size={20} />}
                description={`Criadas ${getPeriodDescription(filters.timePeriod)}`}
                iconBgColor="bg-blue-100"
                periodType={filters.timePeriod}
              />
              <MetricsCard
                title="A Fazer"
                value={stats.todo}
                change={changes.todo}
                icon={<Clock className="text-gray-600" size={20} />}
                description={`Criadas ${getPeriodDescription(filters.timePeriod)} - pendentes`}
                iconBgColor="bg-gray-100"
                periodType={filters.timePeriod}
              />
              <MetricsCard
                title="Em Andamento"
                value={stats.inProgress}
                change={changes.inProgress}
                icon={<Rocket className="text-yellow-600" size={20} />}
                description={`Criadas ${getPeriodDescription(filters.timePeriod)} - em andamento`}
                iconBgColor="bg-yellow-100"
                periodType={filters.timePeriod}
              />
              <MetricsCard
                title="Concluídas"
                value={stats.done}
                change={changes.done}
                icon={<CheckCircle className="text-green-600" size={20} />}
                description={`Criadas ${getPeriodDescription(filters.timePeriod)} - finalizadas`}
                iconBgColor="bg-green-100"
                periodType={filters.timePeriod}
              />
            </div>

            {/* Sidebar and Content Layout */}
            <div className="flex gap-6">
              {/* Sidebar */}
              <Sidebar
                filters={filters}
                onFiltersChange={setFilters}
                sprints={sprints || []}
                issues={tasksCreatedInPeriod}
                allIssues={issues}
                credentials={credentials!}
                projectKey={selectedProject.key}
                quickStats={{
                  activeIssues: stats.inProgress,
                  teamMembers: Array.from(new Set(tasksCreatedInPeriod.filter(i => i.fields.assignee).map(i => i.fields.assignee!.displayName))).length,
                  avgCycleTime: 0
                }}
              />

              {/* Main Content */}
              <div className="flex-1">
                {/* Tabs for Kanban and Charts */}
                <Tabs defaultValue="kanban" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="kanban" className="flex items-center space-x-2">
                      <Columns3 size={16} />
                      <span>Quadro Kanban</span>
                    </TabsTrigger>
                    <TabsTrigger value="charts" className="flex items-center space-x-2">
                      <BarChart3 size={16} />
                      <span>Gráficos de Conclusão</span>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="kanban">
                    <KanbanBoard 
                      issues={tasksCreatedInPeriod} 
                      credentials={credentials!} 
                      projectKey={selectedProject.key} 
                    />
                  </TabsContent>

                  <TabsContent value="charts">
                    <CompletionCharts 
                      issues={tasksCreatedInPeriod} 
                      allIssues={issues} 
                      dashboardFilters={filters}
                    />
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}