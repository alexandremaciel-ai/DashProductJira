import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Rocket, Clock, Bug, Lightbulb, TrendingUp, Loader2, Columns3, Calendar, User, FileText, Tag, ChevronLeft, ChevronRight } from "lucide-react";

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
import { useAdvancedAI, useAIConfiguration } from "@/hooks/use-advanced-ai";
import { AdvancedAIInsights } from "@/components/advanced-ai-insights";
import { exportUtils } from "@/lib/export-utils";

import type { JiraProject, DashboardFilters, JiraIssue } from "@/types/jira";

export default function DashboardPage() {
  const [, setLocation] = useLocation();
  const { credentials, logout, loadStoredCredentials } = useJiraAuth();
  const [selectedProject, setSelectedProject] = useState<JiraProject | null>(null);
  const [aiEnabled, setAIEnabled] = useState(false);
  const [selectedTask, setSelectedTask] = useState<JiraIssue | null>(null);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const tasksPerPage = 10;
  // Helper function to load filters from sessionStorage
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
  
  // AI Insights (legacy)
  const { data: aiInsights, isLoading: aiLoading } = useAIInsights(metrics, aiEnabled);
  
  // Advanced AI Insights
  const { config: aiConfig, updateConfig: updateAIConfig } = useAIConfiguration();
  const { 
    insights: advancedInsights, 
    isLoading: advancedAILoading, 
    refreshInsights: refreshAdvancedInsights 
  } = useAdvancedAI(issues, metrics, credentials, selectedProject?.key || "", aiEnabled, aiConfig);

  // Helper function to get tasks completed in the current period
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

  // Tarefas Concluídas - filtradas pelo período selecionado (baseado na data de resolução)
  const completedTasks = useMemo(() => {
    if (!allIssuesData?.issues) return [];
    
    // Pegar tarefas concluídas no período selecionado
    const currentPeriodCompletedTasks = getTasksCompletedInPeriod(allIssuesData.issues, filters);
    
    return currentPeriodCompletedTasks
      .filter(issue => {
        // Filtrar por membro da equipe selecionado (se aplicável)
        const matchesAssignee = !filters.assignee || 
                               filters.assignee === "all" || 
                               issue.fields.assignee?.accountId === filters.assignee;
        
        // Filtrar por tipo de issue (se aplicável)
        const matchesIssueType = filters.issueTypes.length === 0 || 
                                filters.issueTypes.includes(issue.fields.issuetype.name);
        
        return matchesAssignee && matchesIssueType;
      })
      .sort((a, b) => {
        // Ordenar por data de resolução (mais recente primeiro)
        const dateA = new Date(a.fields.resolutiondate || a.fields.updated);
        const dateB = new Date(b.fields.resolutiondate || b.fields.updated);
        return dateB.getTime() - dateA.getTime();
      });
  }, [allIssuesData?.issues, filters]);

  // Pagination logic for completed tasks
  const totalPages = Math.ceil(completedTasks.length / tasksPerPage);
  const startIndex = (currentPage - 1) * tasksPerPage;
  const endIndex = startIndex + tasksPerPage;
  const paginatedCompletedTasks = completedTasks.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  // Pagination handlers
  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  const handlePageClick = (page: number) => {
    setCurrentPage(page);
  };

  // Save filters to sessionStorage whenever they change
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
      const exportData = {
        metrics,
        issues,
        completedTasks,
        projectName: selectedProject.name,
        filters,
        aiInsights: advancedInsights
      };
      exportUtils.exportToCSV(exportData);
    }
  };

  const handleExportPDF = async () => {
    if (selectedProject) {
      const exportData = {
        metrics,
        issues,
        completedTasks,
        projectName: selectedProject.name,
        filters,
        aiInsights: advancedInsights
      };
      await exportUtils.exportToPDF(exportData);
    }
  };

  const handleGenerateReport = async () => {
    if (selectedProject) {
      const exportData = {
        metrics,
        issues,
        completedTasks,
        projectName: selectedProject.name,
        filters,
        aiInsights: advancedInsights
      };
      await exportUtils.generateReport(exportData);
    }
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

  // Helper function to get tasks completed in previous period for comparison
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

  // Get current and previous period data for comparisons (based on resolution date)
  const currentPeriodCompletedTasks = getTasksCompletedInPeriod(allIssuesData?.issues || [], filters);
  const previousPeriodCompletedTasks = getTasksCompletedFromPreviousPeriod(allIssuesData?.issues || [], filters);

  // Calculate current period stats (show current status of all tasks)
  const currentStats = {
    total: issues.length, // Total de todas as tasks atuais
    todo: issues.filter(i => 
      i.fields.status.statusCategory.name === "To Do" || 
      i.fields.status.statusCategory.key === "new"
    ).length,
    inProgress: issues.filter(i => 
      i.fields.status.statusCategory.name === "In Progress" || 
      i.fields.status.statusCategory.key === "indeterminate"
    ).length,
    done: currentPeriodCompletedTasks.length // Tarefas concluídas no período
  };

  // Calculate previous period stats (based on completed tasks)
  const previousStats = {
    total: previousPeriodCompletedTasks.length,
    todo: 0, // Não temos dados de período anterior para pendentes
    inProgress: 0, // Não temos dados de período anterior para em andamento
    done: previousPeriodCompletedTasks.length // Todas as tarefas do período anterior estão concluídas
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
          onFiltersChange={handleFiltersChange}
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
                  description="Total de tarefas no projeto"
                  iconBgColor="bg-blue-100"
                  periodType={filters.timePeriod}
                />
                <MetricsCard
                  title="A Fazer"
                  value={currentStats.todo}
                  change={changes.todo}
                  icon={<Clock className="text-gray-600" size={20} />}
                  description="Tarefas pendentes atualmente"
                  iconBgColor="bg-gray-100"
                  periodType={filters.timePeriod}
                />
                <MetricsCard
                  title="Em Andamento"
                  value={currentStats.inProgress}
                  change={changes.inProgress}
                  icon={<Rocket className="text-yellow-600" size={20} />}
                  description="Tarefas em desenvolvimento"
                  iconBgColor="bg-yellow-100"
                  periodType={filters.timePeriod}
                />
                <MetricsCard
                  title="Concluídas"
                  value={currentStats.done}
                  change={changes.done}
                  icon={<CheckCircle className="text-green-600" size={20} />}
                  description={`Concluídas ${getPeriodDescription(filters.timePeriod)}`}
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
                    <>
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
                            {paginatedCompletedTasks.map((task) => (
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
                      
                      {/* Pagination */}
                      {totalPages > 1 && (
                        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <span>Mostrando {startIndex + 1} a {Math.min(endIndex, completedTasks.length)} de {completedTasks.length} tarefas</span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handlePreviousPage}
                              disabled={currentPage === 1}
                              className="flex items-center space-x-1"
                            >
                              <ChevronLeft size={16} />
                              <span>Anterior</span>
                            </Button>
                            
                            <div className="flex space-x-1">
                              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                <Button
                                  key={page}
                                  variant={currentPage === page ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => handlePageClick(page)}
                                  className={`min-w-[40px] ${
                                    currentPage === page 
                                      ? "bg-blue-600 text-white hover:bg-blue-700" 
                                      : "text-gray-600 hover:text-gray-700"
                                  }`}
                                >
                                  {page}
                                </Button>
                              ))}
                            </div>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleNextPage}
                              disabled={currentPage === totalPages}
                              className="flex items-center space-x-1"
                            >
                              <span>Próxima</span>
                              <ChevronRight size={16} />
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <CheckCircle className="mx-auto mb-4 text-gray-300" size={48} />
                      <p>Nenhuma tarefa concluída encontrada {getPeriodDescription(filters.timePeriod)}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Advanced AI Insights Section */}
              {aiEnabled && advancedInsights && (
                <AdvancedAIInsights
                  insights={advancedInsights}
                  isLoading={advancedAILoading}
                  onRefresh={refreshAdvancedInsights}
                  onConfigChange={updateAIConfig}
                />
              )}

              {/* Loading State for AI */}
              {aiEnabled && advancedAILoading && (
                <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 mb-8">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Loader2 className="text-white animate-spin" size={20} />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Processando Análise com IA</h3>
                        <div className="flex items-center">
                          <Loader2 className="animate-spin mr-2" size={16} />
                          <span>Analisando {issues.length} issues e gerando insights avançados...</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* AI Disabled State */}
              {!aiEnabled && (
                <Card className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 mb-8">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-gray-400 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Lightbulb className="text-white" size={20} />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Insights com IA</h3>
                        <p className="text-gray-600">Ative a análise com IA no cabeçalho para ver insights avançados sobre desempenho da equipe, previsões e recomendações.</p>
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
