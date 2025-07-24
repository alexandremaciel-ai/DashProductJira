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
import { ConfigurableMetricsCard } from "@/components/configurable-metrics-card";
import { TotalTasksCard } from "@/components/total-tasks-card";
import { useCardConfig } from "@/hooks/use-card-config";
import { calculateCardMetric } from "@/lib/metrics-calculator";
import { useCardFlipState } from "@/hooks/use-card-flip-state";

import { useJiraAuth } from "@/hooks/use-jira-auth";
import { useJiraIssues, useJiraSprints, useProjectMembers } from "@/hooks/use-jira-data";

import type { JiraProject, DashboardFilters, JiraIssue } from "@/types/jira";

export default function KanbanPage() {
  const [, setLocation] = useLocation();
  const { credentials, logout, loadStoredCredentials } = useJiraAuth();
  const [selectedProject, setSelectedProject] = useState<JiraProject | null>(null);
  const [aiEnabled, setAIEnabled] = useState(false);
  const { cardConfig, updateCardConfig } = useCardConfig();
  const { handleCardFlip, isCardFlipped } = useCardFlipState();

  // Helper function to load filters from sessionStorage (same as dashboard)
  const loadFiltersFromStorage = (): DashboardFilters => {
    try {
      const storedFilters = sessionStorage.getItem('dashboardFilters');
      if (storedFilters) {
        return JSON.parse(storedFilters);
      }
    } catch (error) {
      console.warn('Failed to load filters from sessionStorage:', error);
    }
    // Default filters if none stored
    return {
      timePeriod: "week", // Padrão agora é "Esta Semana"
      sprint: undefined,
      assignee: undefined,
      issueTypes: [],
      customStartDate: undefined,
      customEndDate: undefined,
    };
  };

  // Usar os mesmos filtros que o dashboard - agora carregando do sessionStorage
  const [filters, setFilters] = useState<DashboardFilters>(loadFiltersFromStorage());

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

  // Save filters to sessionStorage whenever they change (same as dashboard)
  const handleFiltersChange = (newFilters: DashboardFilters) => {
    setFilters(newFilters);
    try {
      sessionStorage.setItem('dashboardFilters', JSON.stringify(newFilters));
    } catch (error) {
      console.warn('Failed to save filters to sessionStorage:', error);
    }
  };

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

  // Helper function to get tasks completed in the current period (same logic as dashboard)
  const getTasksCompletedInPeriod = (allIssues: JiraIssue[], filters: DashboardFilters) => {
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
          return allIssues.filter(issue => issue.fields.resolutiondate); // Return all completed tasks
        }
        break;
      default:
        return allIssues.filter(issue => issue.fields.resolutiondate); // Return all completed tasks
    }

    return allIssues.filter(issue => {
      // Only consider tasks that have been resolved/completed
      if (!issue.fields.resolutiondate) {
        return false;
      }
      
      const resolutionDate = new Date(issue.fields.resolutiondate);
      if (filters.timePeriod === 'custom' && filters.customEndDate) {
        const endDate = new Date(filters.customEndDate);
        return resolutionDate >= startDate && resolutionDate <= endDate;
      }
      return resolutionDate >= startDate;
    });
  };

  // Get tasks completed in the current period for consistency with dashboard
  const tasksCompletedInPeriod = getTasksCompletedInPeriod(issues, filters);

  const stats = {
    total: calculateCardMetric(issues, cardConfig.total),
    todo: calculateCardMetric(issues, cardConfig.todo),
    inProgress: calculateCardMetric(issues, cardConfig.inProgress),
    done: calculateCardMetric(tasksCompletedInPeriod, cardConfig.done),
    thisWeek: tasksCompletedInPeriod.filter(i => {
      if (!i.fields.resolutiondate) return false;
      const resolved = new Date(i.fields.resolutiondate);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return resolved >= weekAgo;
    }).length
  };

  // Helper function to get tasks completed in previous period for comparison (same logic as dashboard)
  const getTasksCompletedFromPreviousPeriod = (allIssues: JiraIssue[], filters: DashboardFilters) => {
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
      default:
        return []; // No comparison for custom periods
    }

    return allIssues.filter(issue => {
      // Only consider tasks that have been resolved/completed
      if (!issue.fields.resolutiondate) {
        return false;
      }
      
      const resolutionDate = new Date(issue.fields.resolutiondate);
      return resolutionDate >= startDate && resolutionDate <= endDate;
    });
  };

  // Calculate percentage change
  const calculatePercentageChange = (current: number, previous: number): number => {
    if (previous === 0) {
      return current > 0 ? 100 : 0;
    }
    return Math.round(((current - previous) / previous) * 100);
  };

  // Get previous period data for comparisons (based on completion date)
  const previousPeriodCompletedTasks = getTasksCompletedFromPreviousPeriod(issues, filters);

  // Calculate previous period stats (based on completed tasks)
  const previousStats = {
    total: previousPeriodCompletedTasks.length,
    todo: 0, // Não temos dados de período anterior para pendentes
    inProgress: 0, // Não temos dados de período anterior para em andamento
    done: previousPeriodCompletedTasks.length // Todas as tarefas do período anterior estão concluídas
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
      default: return 'em todo período';
    }
  };

  // Debug: Log para verificar se os números estão corretos
  console.log("Kanban Stats Debug:", {
    filter: filters.timePeriod,
    totalCompletedInPeriod: tasksCompletedInPeriod.length,
    totalAllTasks: issues.length,
    totalAvailable: issuesData?.total || 0,
    todoCount: stats.todo,
    inProgressCount: stats.inProgress,
    doneCount: stats.done,
    thisWeekCount: stats.thisWeek,
    changes: changes
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
            {/* Configurable Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 items-start">
              <TotalTasksCard
                title="Total de Tarefas"
                icon={<CheckCircle className="text-blue-600" size={20} />}
                description="Total de tarefas criadas no projeto"
                iconBgColor="bg-blue-100"
                allIssues={issues}
                isFlipped={isCardFlipped('total')}
                onFlip={() => handleCardFlip('total')}
              />
              <ConfigurableMetricsCard
                title="A Fazer"
                value={stats.todo}
                change={changes.todo}
                icon={<Clock className="text-gray-600" size={20} />}
                description="Tarefas pendentes atualmente"
                iconBgColor="bg-gray-100"
                periodType={filters.timePeriod}
                cardConfig={cardConfig.todo}
                allIssues={issues}
                onConfigChange={(config) => updateCardConfig('todo', config)}
                isFlipped={isCardFlipped('todo')}
                onFlip={() => handleCardFlip('todo')}
              />
              <ConfigurableMetricsCard
                title="Em Andamento"
                value={stats.inProgress}
                change={changes.inProgress}
                icon={<Rocket className="text-yellow-600" size={20} />}
                description="Tarefas em desenvolvimento"
                iconBgColor="bg-yellow-100"
                periodType={filters.timePeriod}
                cardConfig={cardConfig.inProgress}
                allIssues={issues}
                onConfigChange={(config) => updateCardConfig('inProgress', config)}
                isFlipped={isCardFlipped('inProgress')}
                onFlip={() => handleCardFlip('inProgress')}
              />
              <ConfigurableMetricsCard
                title="Concluídas"
                value={stats.done}
                change={changes.done}
                icon={<CheckCircle className="text-green-600" size={20} />}
                description={`Concluídas ${getPeriodDescription(filters.timePeriod)}`}
                iconBgColor="bg-green-100"
                periodType={filters.timePeriod}
                cardConfig={cardConfig.done}
                allIssues={tasksCompletedInPeriod}
                onConfigChange={(config) => updateCardConfig('done', config)}
                isFlipped={isCardFlipped('done')}
                onFlip={() => handleCardFlip('done')}
              />
            </div>

            {/* Sidebar and Content Layout */}
            <div className="flex gap-6">
              {/* Sidebar */}
              <Sidebar
                filters={filters}
                onFiltersChange={handleFiltersChange}
                sprints={sprints || []}
                issues={tasksCompletedInPeriod}
                allIssues={issues}
                credentials={credentials!}
                projectKey={selectedProject.key}
                quickStats={{
                  activeIssues: stats.inProgress, // Tarefas em andamento
                  teamMembers: Array.from(new Set(issues.filter(i => i.fields.assignee).map(i => i.fields.assignee!.displayName))).length,
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
                      issues={tasksCompletedInPeriod} 
                      credentials={credentials!} 
                      projectKey={selectedProject.key} 
                    />
                  </TabsContent>

                  <TabsContent value="charts">
                    <CompletionCharts 
                      issues={tasksCompletedInPeriod} 
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