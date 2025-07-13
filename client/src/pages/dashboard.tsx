import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Rocket, Clock, Bug, Lightbulb, TrendingUp, Loader2, Columns3, Calendar, User, FileText, Tag } from "lucide-react";

import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";
import { Footer } from "@/components/footer";
import { MetricsCard } from "@/components/metrics-card";



import { useJiraAuth } from "@/hooks/use-jira-auth";
import { 
  useJiraIssues, 
  useJiraSprints, 
  useProductivityMetrics, 

  useAIInsights,
  useProjectMembers 
} from "@/hooks/use-jira-data";
import { exportUtils } from "@/lib/export-utils";

import type { JiraProject, DashboardFilters, JiraIssue } from "@/types/jira";

export default function DashboardPage() {
  const [, setLocation] = useLocation();
  const { credentials, logout, loadStoredCredentials } = useJiraAuth();
  const [selectedProject, setSelectedProject] = useState<JiraProject | null>(null);
  const [aiEnabled, setAIEnabled] = useState(false);
  const [selectedTask, setSelectedTask] = useState<JiraIssue | null>(null);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
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

  // Fetch data
  const { data: issuesData, isLoading: issuesLoading } = useJiraIssues(
    credentials, 
    selectedProject?.key || null, 
    filters
  );
  const { data: sprints } = useJiraSprints(credentials, selectedProject?.key || null);
  const { data: projectMembers } = useProjectMembers(credentials, selectedProject?.key || null);
  
  // Get all issues without filters to build complete team list
  const { data: allIssuesData } = useJiraIssues(
    credentials, 
    selectedProject?.key || null, 
    { timePeriod: "custom", sprint: undefined, assignee: undefined, issueTypes: [] }
  );

  // Calculate metrics
  const issues = issuesData?.issues || [];
  const metrics = useProductivityMetrics(issues);
  
  // AI Insights
  const { data: aiInsights, isLoading: aiLoading } = useAIInsights(metrics, aiEnabled);

  // Helper function to get tasks created in the current period
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

  // Tarefas Concluídas - filtradas pelo período selecionado
  const completedTasks = useMemo(() => {
    if (!allIssuesData?.issues) return [];
    
    // Pegar tarefas criadas no período selecionado que estão concluídas
    const currentPeriodTasks = getTasksCreatedInPeriod(allIssuesData.issues, filters);
    
    return currentPeriodTasks
      .filter(issue => 
        issue.fields.status.statusCategory.name === "Done" || 
        issue.fields.status.statusCategory.key === "done"
      )
      .sort((a, b) => {
        // Ordenar por data de resolução (mais recente primeiro)
        const dateA = new Date(a.fields.resolutiondate || a.fields.updated);
        const dateB = new Date(b.fields.resolutiondate || b.fields.updated);
        return dateB.getTime() - dateA.getTime();
      });
  }, [allIssuesData?.issues, filters]);

  // Event handlers
  const handleSwitchProject = () => setLocation("/projects");
  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  // Função para extrair texto da descrição do Jira (ADF format)
  const extractTextFromADF = (adfContent: any): string => {
    if (!adfContent) {
      return '';
    }

    // Se é uma string, retorna diretamente
    if (typeof adfContent === 'string') {
      return adfContent;
    }

    // Se não é um objeto, tenta converter para string
    if (typeof adfContent !== 'object') {
      return String(adfContent);
    }

    // Função recursiva para extrair texto de nós ADF
    const extractFromNode = (node: any): string => {
      if (!node) return '';

      let result = '';

      // Se tem texto direto
      if (node.text) {
        result += node.text;
      }

      // Se tem conteúdo (array de nós filhos)
      if (node.content && Array.isArray(node.content)) {
        for (const childNode of node.content) {
          result += extractFromNode(childNode);
        }
      }

      // Adicionar quebra de linha para parágrafos
      if (node.type === 'paragraph' && result) {
        result += '\n\n';
      }

      return result;
    };

    let text = '';

    // Se o ADF tem content (estrutura padrão do Atlassian Document Format)
    if (adfContent.content && Array.isArray(adfContent.content)) {
      text = adfContent.content.map(extractFromNode).join('');
    } else if (adfContent.type && adfContent.content) {
      // Se é um nó único com conteúdo
      text = extractFromNode(adfContent);
    } else {
      // Tentar extrair de qualquer estrutura
      text = extractFromNode(adfContent);
    }

    return text.trim();
  };

  const handleTaskClick = (task: JiraIssue) => {
    setSelectedTask(task);
    setIsTaskDialogOpen(true);
  };

  const handleExportCSV = () => {
    if (selectedProject) {
      exportUtils.exportToCSV(metrics, [], selectedProject.name);
    }
  };

  const handleExportPDF = () => {
    if (selectedProject) {
      exportUtils.exportToPDF(metrics, [], selectedProject.name);
    }
  };

  const handleGenerateReport = () => {
    // Combined export - both CSV and PDF
    handleExportCSV();
    handleExportPDF();
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

  // Helper function to get tasks from previous period for comparison
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

  // Get current and previous period data for comparisons
  const currentPeriodTasks = getTasksCreatedInPeriod(issues, filters);
  const previousPeriodTasks = getTasksFromPreviousPeriod(issues, filters);

  // Calculate current period stats
  const currentStats = {
    total: currentPeriodTasks.length,
    todo: currentPeriodTasks.filter(i => 
      i.fields.status.statusCategory.name === "To Do" || 
      i.fields.status.statusCategory.key === "new"
    ).length,
    inProgress: currentPeriodTasks.filter(i => 
      i.fields.status.statusCategory.name === "In Progress" || 
      i.fields.status.statusCategory.key === "indeterminate"
    ).length,
    done: currentPeriodTasks.filter(i => 
      i.fields.status.statusCategory.name === "Done" || 
      i.fields.status.statusCategory.key === "done"
    ).length
  };

  // Calculate previous period stats
  const previousStats = {
    total: previousPeriodTasks.length,
    todo: previousPeriodTasks.filter(i => 
      i.fields.status.statusCategory.name === "To Do" || 
      i.fields.status.statusCategory.key === "new"
    ).length,
    inProgress: previousPeriodTasks.filter(i => 
      i.fields.status.statusCategory.name === "In Progress" || 
      i.fields.status.statusCategory.key === "indeterminate"
    ).length,
    done: previousPeriodTasks.filter(i => 
      i.fields.status.statusCategory.name === "Done" || 
      i.fields.status.statusCategory.key === "done"
    ).length
  };

  // Calculate percentage changes
  const changes = {
    total: calculatePercentageChange(currentStats.total, previousStats.total),
    todo: calculatePercentageChange(currentStats.todo, previousStats.todo),
    inProgress: calculatePercentageChange(currentStats.inProgress, previousStats.inProgress),
    done: calculatePercentageChange(currentStats.done, previousStats.done)
  };

  // Quick stats - use assignees from current issues
  const assigneesCount = new Set(
    issues
      .filter(issue => issue.fields.assignee)
      .map(issue => issue.fields.assignee!.emailAddress || issue.fields.assignee!.displayName)
  ).size;

  const quickStats = {
    activeIssues: issues.filter(i => i.fields.status.statusCategory.key !== "done").length,
    teamMembers: assigneesCount,
    avgCycleTime: metrics.cycleTime,
  };

  // Recent activities
  const recentActivities = issues
    .filter(issue => issue.fields.resolutiondate)
    .sort((a, b) => new Date(b.fields.updated).getTime() - new Date(a.fields.updated).getTime())
    .slice(0, 5);

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

      <div className="flex">
        <Sidebar
          filters={filters}
          onFiltersChange={setFilters}
          sprints={sprints || []}
          issues={issues}
          credentials={credentials!}
          projectKey={selectedProject?.key || ''}
          quickStats={quickStats}
        />

        <main className="flex-1 p-6">
          {issuesLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="animate-spin" size={32} />
              <span className="ml-2">Carregando dados do dashboard...</span>
            </div>
          ) : (
            <>
              {/* Navigation to Kanban */}
              <div className="flex items-center justify-between mb-6">
                <div></div>
                <Button
                  onClick={() => setLocation("/kanban")}
                  className="bg-blue-600 text-white hover:bg-blue-700"
                >
                  <Columns3 className="mr-2" size={16} />
                  Ver Quadro Kanban
                </Button>
              </div>
              {/* Metrics Cards - Based on Creation Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <MetricsCard
                  title="Total de Tarefas"
                  value={currentStats.total}
                  change={changes.total}
                  icon={<CheckCircle className="text-blue-600" size={20} />}
                  description={`Criadas ${getPeriodDescription(filters.timePeriod)}`}
                  iconBgColor="bg-blue-100"
                  periodType={filters.timePeriod}
                />
                <MetricsCard
                  title="A Fazer"
                  value={currentStats.todo}
                  change={changes.todo}
                  icon={<Clock className="text-gray-600" size={20} />}
                  description={`Criadas ${getPeriodDescription(filters.timePeriod)} - pendentes`}
                  iconBgColor="bg-gray-100"
                  periodType={filters.timePeriod}
                />
                <MetricsCard
                  title="Em Andamento"
                  value={currentStats.inProgress}
                  change={changes.inProgress}
                  icon={<Rocket className="text-yellow-600" size={20} />}
                  description={`Criadas ${getPeriodDescription(filters.timePeriod)} - em andamento`}
                  iconBgColor="bg-yellow-100"
                  periodType={filters.timePeriod}
                />
                <MetricsCard
                  title="Concluídas"
                  value={currentStats.done}
                  change={changes.done}
                  icon={<CheckCircle className="text-green-600" size={20} />}
                  description={`Criadas ${getPeriodDescription(filters.timePeriod)} - finalizadas`}
                  iconBgColor="bg-green-100"
                  periodType={filters.timePeriod}
                />
              </div>



              {/* Tarefas Concluídas Grid */}
              <Card className="border border-gray-200 mb-8">
                <CardHeader>
                  <CardTitle className="text-lg">
                    Tarefas Concluídas {getPeriodDescription(filters.timePeriod)} ({completedTasks.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {completedTasks.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left p-3 font-medium text-gray-900">Task</th>
                            <th className="text-left p-3 font-medium text-gray-900">Responsável</th>
                            <th className="text-left p-3 font-medium text-gray-900">Data de Criação</th>
                            <th className="text-left p-3 font-medium text-gray-900">Data de Resolução</th>
                          </tr>
                        </thead>
                        <tbody>
                          {completedTasks.map((task) => (
                            <tr 
                              key={task.id} 
                              className="border-b border-gray-100 hover:bg-blue-50 cursor-pointer transition-colors"
                              onClick={() => handleTaskClick(task)}
                            >
                              <td className="p-3">
                                <div>
                                  <div className="font-medium text-blue-600">{task.key}</div>
                                  <div className="text-sm text-gray-600 truncate max-w-md" title={task.fields.summary}>
                                    {task.fields.summary}
                                  </div>
                                </div>
                              </td>
                              <td className="p-3">
                                <span className="text-gray-900">
                                  {task.fields.assignee?.displayName || 'Não atribuído'}
                                </span>
                              </td>
                              <td className="p-3">
                                <span className="text-gray-600">
                                  {new Date(task.fields.created).toLocaleDateString('pt-BR')}
                                </span>
                              </td>
                              <td className="p-3">
                                <span className="text-green-600">
                                  {task.fields.resolutiondate 
                                    ? new Date(task.fields.resolutiondate).toLocaleDateString('pt-BR')
                                    : new Date(task.fields.updated).toLocaleDateString('pt-BR')
                                  }
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <CheckCircle className="mx-auto mb-4 text-gray-300" size={48} />
                      <p>Nenhuma tarefa concluída encontrada {getPeriodDescription(filters.timePeriod)}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* AI Insights Section */}
              {aiEnabled && (
                <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 mb-8">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Lightbulb className="text-white" size={20} />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Insights com IA</h3>
                        {aiLoading ? (
                          <div className="flex items-center">
                            <Loader2 className="animate-spin mr-2" size={16} />
                            <span>Gerando insights...</span>
                          </div>
                        ) : aiInsights ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white rounded-lg p-4 border border-gray-200">
                              <h4 className="font-medium text-gray-900 mb-2">
                                <Lightbulb className="inline text-yellow-500 mr-2" size={16} />
                                Insights de Performance
                              </h4>
                              <p className="text-sm text-gray-600">{aiInsights.performance}</p>
                            </div>
                            <div className="bg-white rounded-lg p-4 border border-gray-200">
                              <h4 className="font-medium text-gray-900 mb-2">
                                <TrendingUp className="inline text-green-500 mr-2" size={16} />
                                Previsões
                              </h4>
                              <p className="text-sm text-gray-600">{aiInsights.predictions}</p>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Recent Activity */}
              <Card className="border border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentActivities.length > 0 ? (
                      recentActivities.map((activity) => (
                        <div key={activity.id} className="flex items-center space-x-4 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <CheckCircle className="text-green-600" size={14} />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-gray-900">
                              <span className="font-medium">{activity.fields.assignee?.displayName || "Unknown"}</span> completed{" "}
                              <span className="font-medium">{activity.key}: {activity.fields.summary}</span>
                            </p>
                            <p className="text-xs text-gray-600">
                              {new Date(activity.fields.updated).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-600 text-center py-4">No recent activity found</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </main>
      </div>

      {/* Task Details Dialog */}
      <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedTask && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="text-blue-600" size={20} />
                  {selectedTask.key}: {selectedTask.fields.summary}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Status and Type */}
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <Tag className="text-gray-500" size={16} />
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      {selectedTask.fields.status.name}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {selectedTask.fields.issuetype.name}
                    </Badge>
                  </div>
                </div>

                {/* Assignee */}
                <div className="flex items-center gap-3">
                  <User className="text-gray-500" size={16} />
                  <div>
                    <div className="font-medium text-gray-900">
                      {selectedTask.fields.assignee?.displayName || 'Não atribuído'}
                    </div>
                    {selectedTask.fields.assignee?.emailAddress && (
                      <div className="text-sm text-gray-600">
                        {selectedTask.fields.assignee.emailAddress}
                      </div>
                    )}
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="text-gray-500" size={16} />
                    <div>
                      <div className="text-sm text-gray-600">Data de Criação</div>
                      <div className="font-medium">
                        {new Date(selectedTask.fields.created).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit', 
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>

                  {selectedTask.fields.resolutiondate && (
                    <div className="flex items-center gap-3">
                      <CheckCircle className="text-green-500" size={16} />
                      <div>
                        <div className="text-sm text-gray-600">Data de Resolução</div>
                        <div className="font-medium text-green-600">
                          {new Date(selectedTask.fields.resolutiondate).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Story Points */}
                {selectedTask.fields.customfield_10016 && (
                  <div className="flex items-center gap-3">
                    <TrendingUp className="text-blue-500" size={16} />
                    <div>
                      <div className="text-sm text-gray-600">Story Points</div>
                      <div className="font-medium">
                        {typeof selectedTask.fields.customfield_10016 === 'object' 
                          ? JSON.stringify(selectedTask.fields.customfield_10016)
                          : selectedTask.fields.customfield_10016
                        }
                      </div>
                    </div>
                  </div>
                )}

                {/* Last Updated */}
                <div className="flex items-center gap-3">
                  <Clock className="text-gray-500" size={16} />
                  <div>
                    <div className="text-sm text-gray-600">Última Atualização</div>
                    <div className="font-medium">
                      {new Date(selectedTask.fields.updated).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>

                {/* Summary */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Resumo</h4>
                  <p className="text-gray-700 leading-relaxed">{selectedTask.fields.summary}</p>
                </div>

                {/* Description */}
                {selectedTask.fields.description && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Descrição</h4>
                    <div className="text-gray-700 leading-relaxed bg-gray-50 rounded-lg p-4">
                      <div className="whitespace-pre-wrap text-sm">
                        {extractTextFromADF(selectedTask.fields.description) || 'Descrição não disponível'}
                      </div>
                    </div>
                  </div>
                )}

                {/* Task ID and Link */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">ID da Tarefa</div>
                  <div className="font-mono text-sm text-blue-600">{selectedTask.key}</div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Footer
        lastUpdate={new Date().toLocaleString()}
        onExportCSV={handleExportCSV}
        onExportPDF={handleExportPDF}
        onGenerateReport={handleGenerateReport}
      />
    </div>
  );
}
