import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, Rocket, Clock, Bug, Lightbulb, TrendingUp, Loader2 } from "lucide-react";

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
  useAIInsights 
} from "@/hooks/use-jira-data";
import { exportUtils } from "@/lib/export-utils";

import type { JiraProject, DashboardFilters } from "@/types/jira";

export default function DashboardPage() {
  const [, setLocation] = useLocation();
  const { credentials, logout, loadStoredCredentials } = useJiraAuth();
  const [selectedProject, setSelectedProject] = useState<JiraProject | null>(null);
  const [aiEnabled, setAIEnabled] = useState(false);
  const [filters, setFilters] = useState<DashboardFilters>({
    timePeriod: "week",
    sprint: undefined,
    assignee: undefined,
    issueTypes: ["Stories", "Bugs", "Tasks"],
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

  // Calculate metrics
  const issues = issuesData?.issues || [];
  const metrics = useProductivityMetrics(issues);
  const developerProductivity = useDeveloperProductivity(issues);
  
  // AI Insights
  const { data: aiInsights, isLoading: aiLoading } = useAIInsights(metrics, aiEnabled);

  // Chart data
  const taskEvolutionData = [
    { name: "Mon", value: 12 },
    { name: "Tue", value: 15 },
    { name: "Wed", value: 8 },
    { name: "Thu", value: 18 },
    { name: "Fri", value: 14 },
    { name: "Sat", value: 6 },
    { name: "Sun", value: 4 },
  ];

  const issueDistributionData = [
    { name: "Done", value: issues.filter(i => i.fields.status.statusCategory.name === "Done").length },
    { name: "In Progress", value: issues.filter(i => i.fields.status.statusCategory.name === "In Progress").length },
    { name: "To Do", value: issues.filter(i => i.fields.status.statusCategory.name === "To Do").length },
  ];

  const developerChartData = developerProductivity.map(dev => ({
    name: dev.name.split(" ").map(n => n[0]).join(""),
    issues: dev.issuesResolved,
    storyPoints: dev.storyPoints,
  }));

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

  // Quick stats
  const quickStats = {
    activeIssues: issues.filter(i => i.fields.status.statusCategory.name !== "Done").length,
    teamMembers: new Set(issues.map(i => i.fields.assignee?.emailAddress).filter(Boolean)).size,
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
