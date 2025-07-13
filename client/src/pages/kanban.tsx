import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, BarChart3, Columns3 } from "lucide-react";

import { Header } from "@/components/header";
import { KanbanBoard } from "@/components/kanban-board";
import { CompletionCharts } from "@/components/completion-charts";

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
    timePeriod: "week", // Usar week para consistência com dashboard
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

  const stats = {
    total: issues.length,
    todo: getStatsByStatus("To Do").length,
    inProgress: getStatsByStatus("In Progress").length,
    done: getStatsByStatus("Done").length,
    thisWeek: issues.filter(i => {
      if (!i.fields.resolutiondate) return false;
      const resolved = new Date(i.fields.resolutiondate);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return resolved >= weekAgo;
    }).length
  };

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
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
              <Card className="border border-gray-200">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                  <div className="text-sm text-gray-600">Total de Tarefas</div>
                </CardContent>
              </Card>
              <Card className="border border-gray-200">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-gray-600">{stats.todo}</div>
                  <div className="text-sm text-gray-600">A Fazer</div>
                </CardContent>
              </Card>
              <Card className="border border-gray-200">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
                  <div className="text-sm text-gray-600">Em Progresso</div>
                </CardContent>
              </Card>
              <Card className="border border-gray-200">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.done}</div>
                  <div className="text-sm text-gray-600">Concluídas</div>
                </CardContent>
              </Card>
              <Card className="border border-gray-200">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600">{stats.thisWeek}</div>
                  <div className="text-sm text-gray-600">Esta Semana</div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar and Content Layout */}
            <div className="flex gap-6">
              {/* Sidebar */}
              <Sidebar
                filters={filters}
                onFiltersChange={setFilters}
                sprints={sprints || []}
                issues={issues}
                allIssues={issues}
                credentials={credentials!}
                projectKey={selectedProject.key}
                quickStats={{
                  activeIssues: stats.inProgress,
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
                      issues={issues} 
                      credentials={credentials!} 
                      projectKey={selectedProject.key} 
                    />
                  </TabsContent>

                  <TabsContent value="charts">
                    <CompletionCharts issues={issues} />
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