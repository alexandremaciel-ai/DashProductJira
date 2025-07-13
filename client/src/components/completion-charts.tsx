import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Area, AreaChart } from "recharts";
import { useState, useMemo } from "react";
import { TrendingUp, Clock, Target, Users } from "lucide-react";
import type { JiraIssue } from "@/types/jira";

interface CompletionChartsProps {
  issues: JiraIssue[];
}

type TimeRange = "day" | "week" | "month";

export function CompletionCharts({ issues }: CompletionChartsProps) {
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
    const completedIssues = issues.filter(issue => {
      const isDone = issue.fields.status.statusCategory.name === "Done" ||
                    issue.fields.status.name.toLowerCase().includes("concluído") ||
                    issue.fields.status.name.toLowerCase().includes("done");
      return isDone && issue.fields.resolutiondate;
    });

    const cycleTimesByType: Record<string, number[]> = {};

    completedIssues.forEach(issue => {
      const created = new Date(issue.fields.created);
      const resolved = new Date(issue.fields.resolutiondate!);
      const cycleTimeDays = Math.round((resolved.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
      
      const issueType = issue.fields.issuetype.name;
      if (!cycleTimesByType[issueType]) {
        cycleTimesByType[issueType] = [];
      }
      cycleTimesByType[issueType].push(cycleTimeDays);
    });

    return Object.entries(cycleTimesByType).map(([type, times]) => ({
      name: type,
      avgCycleTime: Math.round(times.reduce((a, b) => a + b, 0) / times.length),
      count: times.length,
      minTime: Math.min(...times),
      maxTime: Math.max(...times)
    })).sort((a, b) => b.count - a.count);
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
    const memberStats: Record<string, { resolved: number; storyPoints: number; avgCycleTime: number }> = {};

    const completedIssues = issues.filter(issue => {
      const isDone = issue.fields.status.statusCategory.name === "Done" ||
                    issue.fields.status.name.toLowerCase().includes("concluído") ||
                    issue.fields.status.name.toLowerCase().includes("done");
      return isDone && issue.fields.assignee;
    });

    completedIssues.forEach(issue => {
      const assignee = issue.fields.assignee!.displayName;
      if (!memberStats[assignee]) {
        memberStats[assignee] = { resolved: 0, storyPoints: 0, avgCycleTime: 0 };
      }
      
      memberStats[assignee].resolved++;
      memberStats[assignee].storyPoints += issue.fields.customfield_10016 || 1;
      
      if (issue.fields.resolutiondate) {
        const created = new Date(issue.fields.created);
        const resolved = new Date(issue.fields.resolutiondate);
        const cycleTime = Math.round((resolved.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
        memberStats[assignee].avgCycleTime = (memberStats[assignee].avgCycleTime + cycleTime) / 2;
      }
    });

    return Object.entries(memberStats).map(([name, stats]) => ({
      name: name.split(' ')[0], // Primeiro nome apenas
      resolved: stats.resolved,
      storyPoints: stats.storyPoints,
      avgCycleTime: Math.round(stats.avgCycleTime)
    })).sort((a, b) => b.resolved - a.resolved);
  }, [issues]);

  const completionData = useMemo(() => {
    // Filtrar tarefas concluídas - usar tanto resolutiondate quanto status
    const completedIssues = issues.filter(issue => {
      const isDone = issue.fields.status.statusCategory.key === "done" || 
                    issue.fields.status.statusCategory.name === "Done" ||
                    issue.fields.status.name.toLowerCase().includes("concluído") ||
                    issue.fields.status.name.toLowerCase().includes("done") ||
                    issue.fields.status.name.toLowerCase().includes("fechado") ||
                    issue.fields.status.name.toLowerCase().includes("resolvido");
      
      // Se tem data de resolução, usar ela; senão usar data de atualização para tarefas Done
      return isDone && (issue.fields.resolutiondate || issue.fields.updated);
    });

    const now = new Date();
    const data: Record<string, number> = {};

    if (timeRange === "day") {
      // Últimos 30 dias
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const key = date.toISOString().split('T')[0];
        data[key] = 0;
      }

      completedIssues.forEach(issue => {
        // Usar resolutiondate se disponível, senão usar updated
        const dateToUse = issue.fields.resolutiondate || issue.fields.updated;
        const resolvedDate = new Date(dateToUse);
        const key = resolvedDate.toISOString().split('T')[0];
        if (data.hasOwnProperty(key)) {
          data[key]++;
        }
      });

      return Object.entries(data).map(([date, count]) => ({
        name: new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        value: count,
        fullDate: date
      }));
    } else if (timeRange === "week") {
      // Últimas 12 semanas
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - (i * 7));
        const weekStart = new Date(date);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        const key = `${weekStart.getFullYear()}-W${Math.ceil(weekStart.getDate() / 7)}`;
        data[key] = 0;
      }

      completedIssues.forEach(issue => {
        const dateToUse = issue.fields.resolutiondate || issue.fields.updated;
        const resolvedDate = new Date(dateToUse);
        const weekStart = new Date(resolvedDate);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        const key = `${weekStart.getFullYear()}-W${Math.ceil(weekStart.getDate() / 7)}`;
        if (data.hasOwnProperty(key)) {
          data[key]++;
        }
      });

      return Object.entries(data).map(([week, count]) => ({
        name: week,
        value: count,
        fullDate: week
      }));
    } else {
      // Últimos 12 meses
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now);
        date.setMonth(date.getMonth() - i);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        data[key] = 0;
      }

      completedIssues.forEach(issue => {
        const dateToUse = issue.fields.resolutiondate || issue.fields.updated;
        const resolvedDate = new Date(dateToUse);
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
  }, [issues, timeRange]);

  const totalCompleted = completionData.reduce((sum, item) => sum + item.value, 0);
  const avgPerPeriod = totalCompleted / completionData.length;

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
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium">Cycle Time por Tipo de Issue</CardTitle>
              <p className="text-sm text-muted-foreground">
                Tempo médio para completar tarefas por tipo
              </p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={cycleTimeData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" fontSize={12} />
                  <YAxis dataKey="name" type="category" fontSize={12} width={100} />
                  <Tooltip 
                    labelStyle={{ color: '#374151' }}
                    contentStyle={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb' }}
                    formatter={(value, name) => {
                      if (name === 'avgCycleTime') return [`${value} dias`, 'Tempo Médio'];
                      if (name === 'count') return [`${value} issues`, 'Quantidade'];
                      return [value, name];
                    }}
                  />
                  <Bar dataKey="avgCycleTime" fill="#f59e0b" name="Cycle Time (dias)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium">Performance da Equipe</CardTitle>
              <p className="text-sm text-muted-foreground">
                Tarefas resolvidas e story points por membro
              </p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
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
                      if (name === 'resolved') return [`${value}`, 'Issues Resolvidas'];
                      if (name === 'storyPoints') return [`${value}`, 'Story Points'];
                      if (name === 'avgCycleTime') return [`${value} dias`, 'Cycle Time Médio'];
                      return [value, name];
                    }}
                  />
                  <Bar dataKey="resolved" fill="#3b82f6" name="Issues Resolvidas" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="storyPoints" fill="#10b981" name="Story Points" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}