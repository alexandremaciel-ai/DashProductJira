import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { CheckCircle, Rocket, Clock, Bug, Lightbulb, TrendingUp, Loader2, Columns3 } from "lucide-react";

import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";
import { Footer } from "@/components/footer";
import { MetricsCard } from "@/components/metrics-card";
import { TaskEvolutionChart } from "@/components/charts/line-chart";
import { IssueDistributionChart } from "@/components/charts/pie-chart";
import { DeveloperProductivityChart } from "@/components/charts/bar-chart";

import { useJiraAuth } from "@/hooks/use-jira-auth";
import { 
  useJiraIssues, 
  useJiraSprints, 
  useProductivityMetrics, 
  useDeveloperProductivity,
  useAIInsights,
  useProjectMembers 
} from "@/hooks/use-jira-data";
import { exportUtils } from "@/lib/export-utils";

import type { JiraProject, DashboardFilters } from "@/types/jira";

export default function DashboardPage() {
  const [, setLocation] = useLocation();
  const { credentials, logout, loadStoredCredentials } = useJiraAuth();
  const [selectedProject, setSelectedProject] = useState<JiraProject | null>(null);
  const [aiEnabled, setAIEnabled] = useState(false);
  const [filters, setFilters] = useState<DashboardFilters>({
    timePeriod: "custom", // Usar custom para não aplicar filtros de data inicialmente
    sprint: undefined,
    assignee: undefined,
    issueTypes: [],
  });
  const [productivityMetric, setProductivityMetric] = useState<"issues" | "storyPoints">("issues");

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

  // Calculate metrics
  const issues = issuesData?.issues || [];
  const metrics = useProductivityMetrics(issues);
  const developerProductivity = useDeveloperProductivity(issues);
  
  // AI Insights
  const { data: aiInsights, isLoading: aiLoading } = useAIInsights(metrics, aiEnabled);

  // Chart data - dynamic task evolution based on real data
  const taskEvolutionData = useMemo(() => {
    if (!issues.length) return [];
    
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date;
    });

    return last7Days.map(date => {
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      const dateStr = date.toISOString().split('T')[0];
      
      // Count issues resolved on this day
      const resolvedOnDay = issues.filter(issue => {
        if (!issue.fields.resolutiondate) return false;
        const resolvedDate = new Date(issue.fields.resolutiondate);
        return resolvedDate.toISOString().split('T')[0] === dateStr;
      }).length;

      return {
        name: dayName,
        value: resolvedOnDay
      };
    });
  }, [issues]);

  // Issue Distribution Data - dynamic based on actual status categories
  const issueDistributionData = useMemo(() => {
    if (!issues.length) return [];
    
    // Group by status category
    const statusCategories = new Map<string, number>();
    
    issues.forEach(issue => {
      const categoryKey = issue.fields.status.statusCategory.key;
      const categoryName = issue.fields.status.statusCategory.name;
      
      // Map category keys to user-friendly names
      let displayName = categoryName;
      if (categoryKey === "new" || categoryKey === "indeterminate") {
        displayName = "A Fazer";
      } else if (categoryKey === "done") {
        displayName = "Concluído";
      } else if (categoryKey === "progress") {
        displayName = "Em Progresso";
      }
      
      statusCategories.set(displayName, (statusCategories.get(displayName) || 0) + 1);
    });
    
    return Array.from(statusCategories.entries()).map(([name, value]) => ({
      name,
      value
    })).filter(item => item.value > 0); // Only show categories with issues
  }, [issues]);

  // Developer Productivity Data - improved with better name handling
  const developerChartData = useMemo(() => {
    if (!developerProductivity.length) return [];
    
    return developerProductivity
      .filter(dev => dev.issuesResolved > 0) // Only show developers with resolved issues
      .map(dev => {
        // Create a better display name - use first name + last initial or just initials if too long
        let displayName = dev.name;
        const nameParts = dev.name.split(" ");
        if (nameParts.length > 1) {
          if (dev.name.length > 15) {
            displayName = nameParts.map(n => n[0]).join("");
          } else {
            displayName = `${nameParts[0]} ${nameParts[nameParts.length - 1][0]}.`;
          }
        }
        
        return {
          name: displayName,
          issues: dev.issuesResolved,
          storyPoints: dev.storyPoints,
        };
      })
      .sort((a, b) => productivityMetric === "issues" ? b.issues - a.issues : b.storyPoints - a.storyPoints)
      .slice(0, 10); // Show top 10 developers
  }, [developerProductivity, productivityMetric]);

  // Event handlers
  const handleSwitchProject = () => setLocation("/projects");
  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  const handleExportCSV = () => {
    if (selectedProject) {
      exportUtils.exportToCSV(metrics, developerProductivity, selectedProject.name);
    }
  };

  const handleExportPDF = () => {
    if (selectedProject) {
      exportUtils.exportToPDF(metrics, developerProductivity, selectedProject.name);
    }
  };

  const handleGenerateReport = () => {
    // Combined export - both CSV and PDF
    handleExportCSV();
    handleExportPDF();
  };

  // Quick stats - use assignees from all issues (not filtered) to show total team count
  const { data: allIssuesData } = useJiraIssues(credentials, selectedProject?.key || null, { 
    timePeriod: "custom", 
    sprint: undefined, 
    assignee: undefined, 
    issueTypes: [] 
  });
  
  const allIssues = allIssuesData?.issues || [];
  const assigneesCount = new Set(
    allIssues
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
              <span className="ml-2">Loading dashboard data...</span>
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
              {/* Metrics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <MetricsCard
                  title="Tasks Delivered"
                  value={metrics.tasksDelivered}
                  change={metrics.tasksDeliveredChange}
                  icon={<CheckCircle className="text-green-600" size={20} />}
                  description="Issues resolved this week"
                  iconBgColor="bg-green-100"
                />
                <MetricsCard
                  title="Team Velocity"
                  value={metrics.velocity}
                  change={metrics.velocityChange}
                  icon={<Rocket className="text-blue-600" size={20} />}
                  description="Story points this sprint"
                  iconBgColor="bg-blue-100"
                />
                <MetricsCard
                  title="Avg. Cycle Time"
                  value={`${metrics.cycleTime} days`}
                  change={metrics.cycleTimeChange}
                  icon={<Clock className="text-yellow-600" size={20} />}
                  description="Days per task"
                  iconBgColor="bg-yellow-100"
                />
                <MetricsCard
                  title="Bug Rate"
                  value={`${metrics.bugRate}%`}
                  change={metrics.bugRateChange}
                  icon={<Bug className="text-red-600" size={20} />}
                  description="Bugs vs total issues"
                  iconBgColor="bg-red-100"
                />
              </div>

              {/* Debug Card - Metrics Breakdown */}
              <Card className="border border-blue-200 bg-blue-50 mb-6">
                <CardHeader>
                  <CardTitle className="text-lg text-blue-800">Debug: Dados Calculados</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="font-semibold text-blue-700">Total de Tarefas:</p>
                      <p className="text-blue-600">{issues.length}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-blue-700">Tarefas Concluídas (Semana):</p>
                      <p className="text-blue-600">{metrics.tasksDelivered}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-blue-700">Story Points (Semana):</p>
                      <p className="text-blue-600">{metrics.velocity}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-blue-700">Desenvolvedores Ativos:</p>
                      <p className="text-blue-600">{developerProductivity.length}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-blue-700">Distribuição de Status:</p>
                      <p className="text-blue-600">{issueDistributionData.map(d => `${d.name}: ${d.value}`).join(", ")}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-blue-700">Tipos de Issue:</p>
                      <p className="text-blue-600">{[...new Set(issues.map(i => i.fields.issuetype.name))].slice(0, 3).join(", ")}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-blue-700">Gráfico Dev:</p>
                      <p className="text-blue-600">{developerChartData.length} desenvolvedores</p>
                    </div>
                    <div>
                      <p className="font-semibold text-blue-700">Evolução (7 dias):</p>
                      <p className="text-blue-600">{taskEvolutionData.reduce((sum, d) => sum + d.value, 0)} tarefas</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <Card className="border border-gray-200">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Tasks Evolution</CardTitle>
                      <div className="flex items-center space-x-2">
                        <button className="px-3 py-1 text-xs bg-blue-600 text-white rounded-lg">Week</button>
                        <button className="px-3 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded-lg">Month</button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <TaskEvolutionChart data={taskEvolutionData} title="Tasks Evolution" />
                  </CardContent>
                </Card>

                <Card className="border border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-lg">Issue Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <IssueDistributionChart data={issueDistributionData} />
                  </CardContent>
                </Card>
              </div>

              {/* Developer Productivity Chart */}
              <Card className="border border-gray-200 mb-8">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Developer Productivity</CardTitle>
                    <Select value={productivityMetric} onValueChange={(value: "issues" | "storyPoints") => setProductivityMetric(value)}>
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="issues">Issues Resolved</SelectItem>
                        <SelectItem value="storyPoints">Story Points</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  <DeveloperProductivityChart data={developerChartData} metric={productivityMetric} />
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
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">AI-Powered Insights</h3>
                        {aiLoading ? (
                          <div className="flex items-center">
                            <Loader2 className="animate-spin mr-2" size={16} />
                            <span>Generating insights...</span>
                          </div>
                        ) : aiInsights ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white rounded-lg p-4 border border-gray-200">
                              <h4 className="font-medium text-gray-900 mb-2">
                                <Lightbulb className="inline text-yellow-500 mr-2" size={16} />
                                Performance Insights
                              </h4>
                              <p className="text-sm text-gray-600">{aiInsights.performance}</p>
                            </div>
                            <div className="bg-white rounded-lg p-4 border border-gray-200">
                              <h4 className="font-medium text-gray-900 mb-2">
                                <TrendingUp className="inline text-green-500 mr-2" size={16} />
                                Predictions
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

      <Footer
        lastUpdate={new Date().toLocaleString()}
        onExportCSV={handleExportCSV}
        onExportPDF={handleExportPDF}
        onGenerateReport={handleGenerateReport}
      />
    </div>
  );
}
