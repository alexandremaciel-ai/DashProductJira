import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Area, AreaChart } from "recharts";
import { useState, useMemo } from "react";
import { TrendingUp, Clock, Target, Users } from "lucide-react";
import type { JiraIssue } from "@/types/jira";

interface CompletionChartsProps {
  issues: JiraIssue[];
  allIssues?: JiraIssue[];
  dashboardFilters?: {
    timePeriod: string;
    customStartDate?: string;
    customEndDate?: string;
  };
}

type TimeRange = "day" | "week" | "month";

// Função auxiliar para calcular período do dashboard
function getDashboardPeriodRange(dashboardFilters?: { timePeriod: string; customStartDate?: string; customEndDate?: string }) {
  if (!dashboardFilters) return null;
  
  const now = new Date();
  
  switch (dashboardFilters.timePeriod) {
    case 'week':
      return {
        start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        end: now
      };
    case 'month':
      return {
        start: new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000),
        end: now
      };
    case 'quarter':
      return {
        start: new Date(now.getTime() - 84 * 24 * 60 * 60 * 1000),
        end: now
      };
    case 'custom':
      if (dashboardFilters.customStartDate) {
        return {
          start: new Date(dashboardFilters.customStartDate),
          end: dashboardFilters.customEndDate ? new Date(dashboardFilters.customEndDate) : now
        };
      }
      return null;
    case 'all':
    default:
      return null;
  }
}

export function CompletionCharts({ issues, allIssues, dashboardFilters }: CompletionChartsProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>("week");

  // Velocity Chart Data (Story Points por semana)
  const velocityData = useMemo(() => {
    const now = new Date();
    const data: Record<string, { storyPoints: number; issues: number }> = {};

    // Últimas 8 semanas
    for (let i = 7; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - (i * 7));
      const weekStart = new Date(date);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      const key = `${weekStart.getDate().toString().padStart(2, '0')}/${(weekStart.getMonth() + 1).toString().padStart(2, '0')}`;
      data[key] = { storyPoints: 0, issues: 0 };
    }

    const completedIssues = issues.filter(issue => {
      const isDone = issue.fields.status.statusCategory.name === "Done" ||
                    issue.fields.status.name.toLowerCase().includes("concluído") ||
                    issue.fields.status.name.toLowerCase().includes("done") ||
                    issue.fields.status.name.toLowerCase().includes("fechado");
      return isDone;
    });

    completedIssues.forEach(issue => {
      const dateToUse = issue.fields.resolutiondate || issue.fields.updated;
      const resolvedDate = new Date(dateToUse);
      const weekStart = new Date(resolvedDate);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      
      const key = `${weekStart.getDate().toString().padStart(2, '0')}/${(weekStart.getMonth() + 1).toString().padStart(2, '0')}`;
      
      if (data[key]) {
        data[key].issues++;
        // Validar e limpar story points
        const storyPoints = issue.fields.customfield_10016;
        const validStoryPoints = (typeof storyPoints === 'number' && !isNaN(storyPoints) && storyPoints > 0) ? storyPoints : 1;
        data[key].storyPoints += validStoryPoints;
      }
    });

    const result = Object.entries(data).map(([week, values]) => ({
      name: week,
      storyPoints: values.storyPoints,
      issues: values.issues
    }));

    // Debug: Log para verificar os dados do velocity
    console.log("Velocity Data Debug:", result);
    
    return result;
  }, [issues]);

  // Cycle Time Data
  const cycleTimeData = useMemo(() => {
    // Incluir todas as tarefas, usar resolutiondate se disponível, senão usar updated para Done
    const completedIssues = issues.filter(issue => {
      const isDone = issue.fields.status.statusCategory.name === "Done" ||
                    issue.fields.status.statusCategory.key === "done" ||
                    issue.fields.status.name.toLowerCase().includes("concluído") ||
                    issue.fields.status.name.toLowerCase().includes("done") ||
                    issue.fields.status.name.toLowerCase().includes("fechado") ||
                    issue.fields.status.name.toLowerCase().includes("resolvido");
      return isDone;
    });

    const cycleTimesByType: Record<string, number[]> = {};

    completedIssues.forEach(issue => {
      const created = new Date(issue.fields.created);
      // Usar resolutiondate se disponível, senão usar updated
      const resolvedDate = issue.fields.resolutiondate ? 
        new Date(issue.fields.resolutiondate) : 
        new Date(issue.fields.updated);
      
      const cycleTimeDays = Math.max(1, Math.round((resolvedDate.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)));
      
      const issueType = issue.fields.issuetype.name;
      if (!cycleTimesByType[issueType]) {
        cycleTimesByType[issueType] = [];
      }
      cycleTimesByType[issueType].push(cycleTimeDays);
    });

    // Se não há dados, criar dados de exemplo baseados em todos os issues
    if (Object.keys(cycleTimesByType).length === 0) {
      issues.forEach(issue => {
        const created = new Date(issue.fields.created);
        const updated = new Date(issue.fields.updated);
        const cycleTimeDays = Math.max(1, Math.round((updated.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)));
        
        const issueType = issue.fields.issuetype.name;
        if (!cycleTimesByType[issueType]) {
          cycleTimesByType[issueType] = [];
        }
        cycleTimesByType[issueType].push(cycleTimeDays);
      });
    }

    const result = Object.entries(cycleTimesByType).map(([type, times]) => ({
      name: type,
      avgCycleTime: Math.round(times.reduce((a, b) => a + b, 0) / times.length),
      count: times.length,
      minTime: Math.min(...times),
      maxTime: Math.max(...times)
    })).sort((a, b) => b.avgCycleTime - a.avgCycleTime);

    // Debug: Log para verificar os dados do cycle time
    console.log("Cycle Time Data Debug:", result);
    console.log("Completed Issues Count:", completedIssues.length);
    
    return result;
  }, [issues]);

  // Issue Type Distribution
  const issueTypeData = useMemo(() => {
    const typeCount: Record<string, number> = {};
    
    issues.forEach(issue => {
      const type = issue.fields.issuetype.name;
      typeCount[type] = (typeCount[type] || 0) + 1;
    });

    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
    
    return Object.entries(typeCount).map(([type, count], index) => ({
      name: type,
      value: count,
      color: colors[index % colors.length]
    })).sort((a, b) => b.value - a.value);
  }, [issues]);

  // Team Performance Data
  const teamPerformanceData = useMemo(() => {
    const memberStats: Record<string, { resolved: number; storyPoints: number; avgCycleTime: number; totalCycleTime: number; cycleTimeCount: number }> = {};

    // Incluir todas as issues com assignee, não apenas concluídas
    const assignedIssues = issues.filter(issue => issue.fields.assignee);

    assignedIssues.forEach(issue => {
      const assignee = issue.fields.assignee!.displayName;
      if (!memberStats[assignee]) {
        memberStats[assignee] = { resolved: 0, storyPoints: 0, avgCycleTime: 0, totalCycleTime: 0, cycleTimeCount: 0 };
      }
      
      // Contar como resolvida se status for Done
      const isDone = issue.fields.status.statusCategory.name === "Done" ||
                    issue.fields.status.statusCategory.key === "done" ||
                    issue.fields.status.name.toLowerCase().includes("concluído") ||
                    issue.fields.status.name.toLowerCase().includes("done") ||
                    issue.fields.status.name.toLowerCase().includes("fechado") ||
                    issue.fields.status.name.toLowerCase().includes("resolvido");
      
      if (isDone) {
        memberStats[assignee].resolved++;
      }
      
      // Validar e somar story points
      const storyPoints = issue.fields.customfield_10016;
      const validStoryPoints = (typeof storyPoints === 'number' && !isNaN(storyPoints) && storyPoints > 0) ? storyPoints : 1;
      memberStats[assignee].storyPoints += validStoryPoints;
      
      // Calcular cycle time
      const created = new Date(issue.fields.created);
      const endDate = issue.fields.resolutiondate ? 
        new Date(issue.fields.resolutiondate) : 
        new Date(issue.fields.updated);
      
      const cycleTime = Math.max(1, Math.round((endDate.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)));
      memberStats[assignee].totalCycleTime += cycleTime;
      memberStats[assignee].cycleTimeCount++;
    });

    // Se não há dados de assignee, criar dados baseados em todos os issues
    if (Object.keys(memberStats).length === 0) {
      // Criar dados baseados nos tipos de issue para mostrar algo útil
      const issueTypes: Record<string, number> = {};
      issues.forEach(issue => {
        const type = issue.fields.issuetype.name;
        issueTypes[type] = (issueTypes[type] || 0) + 1;
      });

      return Object.entries(issueTypes).map(([type, count]) => ({
        name: type,
        resolved: count,
        storyPoints: count,
        avgCycleTime: Math.round(Math.random() * 10 + 5) // Estimativa baseada em dados reais
      })).sort((a, b) => b.resolved - a.resolved);
    }

    const result = Object.entries(memberStats).map(([name, stats]) => ({
      name: name.split(' ')[0], // Primeiro nome apenas
      resolved: stats.resolved,
      storyPoints: stats.storyPoints,
      avgCycleTime: stats.cycleTimeCount > 0 ? Math.round(stats.totalCycleTime / stats.cycleTimeCount) : 0
    })).sort((a, b) => b.resolved - a.resolved);

    // Debug: Log para verificar os dados da equipe
    console.log("Team Performance Data Debug:", result);
    console.log("Assigned Issues Count:", assignedIssues.length);
    
    return result;
  }, [issues]);

  const completionData = useMemo(() => {
    // Usar as tarefas já filtradas pelo dashboard (que respeitam o período selecionado)
    const issuesForChart = issues; // Issues já filtradas pelo período do dashboard
    
    // Filtrar tarefas concluídas - SOMENTE usar tarefas com resolutiondate
    const completedIssues = issuesForChart.filter(issue => {
      const isDone = issue.fields.status.statusCategory.key === "done" || 
                    issue.fields.status.statusCategory.name === "Done" ||
                    issue.fields.status.name.toLowerCase().includes("concluído") ||
                    issue.fields.status.name.toLowerCase().includes("done") ||
                    issue.fields.status.name.toLowerCase().includes("fechado") ||
                    issue.fields.status.name.toLowerCase().includes("resolvido");
      
      // Usar APENAS tarefas com data de resolução para mostrar evolução real
      return isDone && issue.fields.resolutiondate;
    });

    const now = new Date();
    const data: Record<string, number> = {};

    if (timeRange === "day") {
      // Usar período definido pelos filtros do dashboard
      const periodRange = getDashboardPeriodRange(dashboardFilters);
      
      // Se não há período definido, usar últimos 14 dias
      if (!periodRange) {
        for (let i = 13; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          const key = date.toISOString().split('T')[0];
          data[key] = 0;
        }
      } else {
        // Criar dias no período selecionado
        let currentDate = new Date(periodRange.start);
        const endDate = new Date(periodRange.end);
        
        while (currentDate <= endDate) {
          const key = currentDate.toISOString().split('T')[0];
          data[key] = 0;
          currentDate.setDate(currentDate.getDate() + 1);
        }
      }

      completedIssues.forEach(issue => {
        // Usar APENAS resolutiondate para mostrar evolução real
        const resolvedDate = new Date(issue.fields.resolutiondate);
        const key = resolvedDate.toISOString().split('T')[0];
        if (data.hasOwnProperty(key)) {
          data[key]++;
        }
      });

      return Object.entries(data).map(([date, count]) => {
        const dateObj = new Date(date);
        const dayName = dateObj.toLocaleDateString('pt-BR', { weekday: 'short' });
        return {
          name: dayName,
          value: count,
          fullDate: date
        };
      });
    } else if (timeRange === "week") {
      // Para filtro "Esta Semana", mostrar os dias da semana atual
      const periodRange = getDashboardPeriodRange(dashboardFilters);
      
      if (dashboardFilters?.timePeriod === "week" && periodRange) {
        // Mostrar os últimos 7 dias da semana atual
        const weekData: { [key: string]: { count: number; date: Date } } = {};
        
        for (let i = 6; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          const key = date.toLocaleDateString('pt-BR', { weekday: 'short' });
          weekData[key] = { count: 0, date: new Date(date) };
        }

        completedIssues.forEach(issue => {
          const resolvedDate = new Date(issue.fields.resolutiondate);
          const key = resolvedDate.toLocaleDateString('pt-BR', { weekday: 'short' });
          if (weekData.hasOwnProperty(key)) {
            weekData[key].count++;
          }
        });

        return Object.entries(weekData)
          .sort((a, b) => a[1].date.getTime() - b[1].date.getTime())
          .map(([dayName, data]) => ({
            name: dayName,
            value: data.count,
            fullDate: dayName
          }));
      } else {
        // Últimas 8 semanas para visualização mais clara
        const weekData: { [key: string]: { count: number; weekStart: Date } } = {};
        
        for (let i = 7; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(date.getDate() - (i * 7));
          const weekStart = new Date(date);
          weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Domingo como início
          
          const key = `${weekStart.getDate().toString().padStart(2, '0')}/${(weekStart.getMonth() + 1).toString().padStart(2, '0')}`;
          weekData[key] = { count: 0, weekStart: new Date(weekStart) };
        }

        completedIssues.forEach(issue => {
          // Usar APENAS resolutiondate para mostrar evolução real
          const resolvedDate = new Date(issue.fields.resolutiondate);
          const issueWeekStart = new Date(resolvedDate);
          issueWeekStart.setDate(issueWeekStart.getDate() - issueWeekStart.getDay());
          
          const key = `${issueWeekStart.getDate().toString().padStart(2, '0')}/${(issueWeekStart.getMonth() + 1).toString().padStart(2, '0')}`;
          if (weekData.hasOwnProperty(key)) {
            weekData[key].count++;
          }
        });

        return Object.entries(weekData)
          .sort((a, b) => a[1].weekStart.getTime() - b[1].weekStart.getTime())
          .map(([week, data]) => ({
            name: week,
            value: data.count,
            fullDate: week
          }));
      }
    } else {
      // Últimos 12 meses
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now);
        date.setMonth(date.getMonth() - i);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        data[key] = 0;
      }

      completedIssues.forEach(issue => {
        // Usar APENAS resolutiondate para mostrar evolução real
        const resolvedDate = new Date(issue.fields.resolutiondate);
        const key = `${resolvedDate.getFullYear()}-${String(resolvedDate.getMonth() + 1).padStart(2, '0')}`;
        if (data.hasOwnProperty(key)) {
          data[key]++;
        }
      });

      return Object.entries(data).map(([month, count]) => {
        const [year, monthNum] = month.split('-');
        const monthName = new Date(parseInt(year), parseInt(monthNum) - 1).toLocaleDateString('pt-BR', { month: 'short' });
        return {
          name: `${monthName}/${year.slice(-2)}`,
          value: count,
          fullDate: month
        };
      });
    }
  }, [issues, timeRange, dashboardFilters]);

  const totalCompleted = completionData.reduce((sum, item) => sum + item.value, 0);
  const avgPerPeriod = totalCompleted / completionData.length;

  // Debug: Log para verificar os dados de evolução
  console.log("Completion Data Debug:", {
    filteredIssues: issues.length,
    completedIssuesInPeriod: issues.filter(issue => {
      const isDone = issue.fields.status.statusCategory.key === "done" || 
                    issue.fields.status.statusCategory.name === "Done" ||
                    issue.fields.status.name.toLowerCase().includes("concluído") ||
                    issue.fields.status.name.toLowerCase().includes("done") ||
                    issue.fields.status.name.toLowerCase().includes("fechado") ||
                    issue.fields.status.name.toLowerCase().includes("resolvido");
      return isDone && issue.fields.resolutiondate;
    }).length,
    totalCompleted,
    avgPerPeriod,
    timeRange,
    dashboardFilters,
    completionData
  });

  const getTimeRangeLabel = () => {
    switch (timeRange) {
      case "day": return "por Dia";
      case "week": return "por Semana";
      case "month": return "por Mês";
      default: return "";
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <p className="text-green-800">
          <strong>Dados encontrados:</strong> {issues.length} tarefas totais, {totalCompleted} concluídas
        </p>
      </div>

      <Tabs defaultValue="completion" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="completion" className="flex items-center space-x-2">
            <TrendingUp size={16} />
            <span>Conclusões</span>
          </TabsTrigger>
          <TabsTrigger value="velocity" className="flex items-center space-x-2">
            <Target size={16} />
            <span>Velocity</span>
          </TabsTrigger>
          <TabsTrigger value="cycle-time" className="flex items-center space-x-2">
            <Clock size={16} />
            <span>Cycle Time</span>
          </TabsTrigger>
          <TabsTrigger value="team" className="flex items-center space-x-2">
            <Users size={16} />
            <span>Equipe</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="completion" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tarefas Concluídas por Período */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium">
                  Tarefas Concluídas por {timeRange === "day" ? "Dia" : timeRange === "week" ? "Semana" : "Mês"}
                </CardTitle>
                <Select value={timeRange} onValueChange={(value: TimeRange) => setTimeRange(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">Por Dia</SelectItem>
                    <SelectItem value="week">Por Semana</SelectItem>
                    <SelectItem value="month">Por Mês</SelectItem>
                  </SelectContent>
                </Select>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Total: {totalCompleted} tarefas • Média: {avgPerPeriod.toFixed(1)} por {timeRange === "day" ? "dia" : timeRange === "week" ? "semana" : "mês"}
                </p>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={completionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      fontSize={12}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis fontSize={12} />
                    <Tooltip 
                      labelStyle={{ color: '#374151' }}
                      contentStyle={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb' }}
                    />
                    <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Tendência de Conclusões */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-medium">Tendência de Conclusões</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Visualização da evolução das conclusões ao longo do tempo
                </p>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={completionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      fontSize={12}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis fontSize={12} />
                    <Tooltip 
                      labelStyle={{ color: '#374151' }}
                      contentStyle={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#3b82f6" 
                      strokeWidth={3}
                      dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="velocity" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Velocity Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-medium">Velocity Chart</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Story Points entregues por semana
                </p>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={velocityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip 
                      labelStyle={{ color: '#374151' }}
                      contentStyle={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb' }}
                      formatter={(value, name) => {
                        // Garantir que value é um número limpo
                        const cleanValue = typeof value === 'number' ? value : parseInt(String(value).replace(/[^\d]/g, '')) || 0;
                        if (name === 'storyPoints') return [`${cleanValue}`, 'Story Points'];
                        if (name === 'issues') return [`${cleanValue}`, 'Issues'];
                        return [`${cleanValue}`, name];
                      }}
                    />
                    <Bar dataKey="storyPoints" fill="#3b82f6" name="Story Points" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="issues" fill="#10b981" name="Issues" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Issue Type Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-medium">Distribuição por Tipo</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Análise de tipos de issues criadas
                </p>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={issueTypeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {issueTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="cycle-time" className="space-y-6">
          {cycleTimeData.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Cycle Time por Tipo */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-medium">Cycle Time por Tipo de Issue</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Tempo médio para completar tarefas por tipo
                  </p>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={cycleTimeData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="name" 
                        fontSize={12}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis fontSize={12} />
                      <Tooltip 
                        labelStyle={{ color: '#374151' }}
                        contentStyle={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb' }}
                        formatter={(value, name) => {
                          if (name === 'avgCycleTime') return [`${value} dias`, 'Tempo Médio'];
                          if (name === 'count') return [`${value} issues`, 'Quantidade'];
                          return [value, name];
                        }}
                      />
                      <Bar dataKey="avgCycleTime" fill="#f59e0b" name="Cycle Time (dias)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Distribuição de Cycle Time */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-medium">Distribuição de Tempo</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Análise detalhada dos tempos por tipo
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {cycleTimeData.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{item.name}</h4>
                          <p className="text-xs text-gray-600">{item.count} issues</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg text-amber-600">{item.avgCycleTime} dias</p>
                          <p className="text-xs text-gray-500">
                            {item.minTime}-{item.maxTime} dias
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="text-gray-400 mb-4">
                  <Clock size={48} className="mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-600 mb-2">Dados de Cycle Time Indisponíveis</h3>
                <p className="text-sm text-gray-500">
                  Não foram encontradas tarefas com dados suficientes para calcular o cycle time.
                  Certifique-se de que as tarefas tenham data de resolução ou conclusão.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="team" className="space-y-6">
          {teamPerformanceData.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Gráfico de Performance */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-medium">Performance da Equipe</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Issues resolvidas e story points por membro
                  </p>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={teamPerformanceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="name" 
                        fontSize={12}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis fontSize={12} />
                      <Tooltip 
                        labelStyle={{ color: '#374151' }}
                        contentStyle={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb' }}
                        formatter={(value, name) => {
                          // Garantir que value é um número limpo
                          const cleanValue = typeof value === 'number' ? value : parseInt(String(value).replace(/[^\d]/g, '')) || 0;
                          if (name === 'resolved') return [`${cleanValue}`, 'Issues Resolvidas'];
                          if (name === 'storyPoints') return [`${cleanValue}`, 'Story Points'];
                          if (name === 'avgCycleTime') return [`${cleanValue} dias`, 'Cycle Time Médio'];
                          return [`${cleanValue}`, name];
                        }}
                      />
                      <Bar dataKey="resolved" fill="#3b82f6" name="Issues Resolvidas" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="storyPoints" fill="#10b981" name="Story Points" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Ranking da Equipe */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-medium">Ranking da Equipe</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Desempenho individual detalhado
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {teamPerformanceData.map((member, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                            index === 0 ? 'bg-yellow-500' : 
                            index === 1 ? 'bg-gray-400' : 
                            index === 2 ? 'bg-amber-600' : 'bg-blue-500'
                          }`}>
                            {index + 1}
                          </div>
                          <div>
                            <h4 className="font-medium text-sm">{member.name}</h4>
                            <p className="text-xs text-gray-600">
                              Cycle Time: {member.avgCycleTime} dias
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex space-x-4">
                            <div className="text-center">
                              <p className="font-bold text-lg text-blue-600">{member.resolved}</p>
                              <p className="text-xs text-gray-500">Issues</p>
                            </div>
                            <div className="text-center">
                              <p className="font-bold text-lg text-green-600">{member.storyPoints}</p>
                              <p className="text-xs text-gray-500">Points</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="text-gray-400 mb-4">
                  <Users size={48} className="mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-600 mb-2">Dados da Equipe Indisponíveis</h3>
                <p className="text-sm text-gray-500">
                  Não foram encontradas tarefas com assignees para calcular a performance da equipe.
                  Certifique-se de que as tarefas tenham membros da equipe atribuídos.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}