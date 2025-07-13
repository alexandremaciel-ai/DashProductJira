import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { useState, useMemo } from "react";
import type { JiraIssue } from "@/types/jira";

interface CompletionChartsProps {
  issues: JiraIssue[];
}

type TimeRange = "day" | "week" | "month";

export function CompletionCharts({ issues }: CompletionChartsProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>("week");

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
    <div className="space-y-4">
      {/* Debug info */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <p className="text-sm text-green-800">
          <strong>Dados encontrados:</strong> {issues.length} tarefas totais, {completionData.reduce((sum, item) => sum + item.value, 0)} concluídas
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Barras - Conclusões */}
        <Card className="border border-gray-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Tarefas Concluídas {getTimeRangeLabel()}</CardTitle>
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
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span>Total: {totalCompleted} tarefas</span>
              <span>•</span>
              <span>Média: {avgPerPeriod.toFixed(1)} {getTimeRangeLabel().toLowerCase()}</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={completionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#525252"
                    fontSize={12}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis 
                    stroke="#525252"
                    fontSize={12}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e0e0e0",
                      borderRadius: "8px",
                    }}
                    formatter={(value) => [`${value} tarefas`, 'Concluídas']}
                  />
                  <Bar 
                    dataKey="value" 
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico de Linha - Tendência */}
        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg">Tendência de Conclusões</CardTitle>
            <p className="text-sm text-gray-600">
              Visualização da evolução das conclusões ao longo do tempo
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={completionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#525252"
                    fontSize={12}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis 
                    stroke="#525252"
                    fontSize={12}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e0e0e0",
                      borderRadius: "8px",
                    }}
                    formatter={(value) => [`${value} tarefas`, 'Concluídas']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: "#3b82f6", strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}