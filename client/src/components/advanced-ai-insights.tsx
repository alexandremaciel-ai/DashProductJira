import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  AlertTriangle, 
  CheckCircle,
  Target,
  BarChart3,
  Activity,
  User,
  Calendar,
  Clock,
  Zap,
  Shield
} from "lucide-react";

import type { IntelligentInsights, DeveloperPerformance, TeamHealthMetrics } from "@/types/ai-insights";

interface AdvancedAIInsightsProps {
  insights: IntelligentInsights;
  isLoading: boolean;
  onRefresh: () => void;
  onConfigChange: (config: any) => void;
}

export function AdvancedAIInsights({ insights, isLoading, onRefresh, onConfigChange }: AdvancedAIInsightsProps) {
  const [activeTab, setActiveTab] = useState("overview");

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 80) return "bg-green-100 text-green-800";
    if (score >= 60) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "low": return "text-green-600";
      case "medium": return "text-yellow-600";
      case "high": return "text-red-600";
      default: return "text-gray-600";
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200">
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center animate-pulse">
              <Brain className="text-white" size={24} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Análise Inteligente em Andamento</h3>
              <p className="text-gray-600">Processando dados com IA...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                <Brain className="text-white" size={24} />
              </div>
              <div>
                <CardTitle className="text-xl">Insights Inteligentes</CardTitle>
                <p className="text-sm text-gray-600">Análise avançada com IA</p>
              </div>
            </div>
            <Button onClick={onRefresh} size="sm" variant="outline">
              <Activity className="mr-2" size={16} />
              Atualizar Análise
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <p className="text-gray-700 leading-relaxed">{insights.summary}</p>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="team">Equipe</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="predictions">Previsões</TabsTrigger>
          <TabsTrigger value="actions">Ações</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Key Findings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="text-blue-600" size={20} />
                  Principais Descobertas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {insights.keyFindings.map((finding, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <CheckCircle className="text-green-500 mt-1 flex-shrink-0" size={16} />
                      <p className="text-sm text-gray-700">{finding}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Anomalies */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="text-orange-600" size={20} />
                  Anomalias Detectadas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {insights.anomalies.anomalies.map((anomaly, index) => (
                    <Alert key={index} className="border-l-4 border-l-orange-500">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{anomaly.type}</span>
                          <Badge className={`${
                            anomaly.severity === 'high' ? 'bg-red-100 text-red-800' :
                            anomaly.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {anomaly.severity}
                          </Badge>
                        </div>
                        <p className="text-sm mt-1">{anomaly.description}</p>
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Team Health Tab */}
        <TabsContent value="team" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="text-blue-600" size={20} />
                Saúde da Equipe
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {insights.teamHealth.overallHealth}%
                  </div>
                  <div className="text-sm text-gray-600">Saúde Geral</div>
                  <Progress value={insights.teamHealth.overallHealth} className="mt-2" />
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {insights.teamHealth.morale}%
                  </div>
                  <div className="text-sm text-gray-600">Moral</div>
                  <Progress value={insights.teamHealth.morale} className="mt-2" />
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {insights.teamHealth.burnoutRisk}%
                  </div>
                  <div className="text-sm text-gray-600">Risco de Burnout</div>
                  <Progress value={insights.teamHealth.burnoutRisk} className="mt-2" />
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {insights.teamHealth.efficiency}%
                  </div>
                  <div className="text-sm text-gray-600">Eficiência</div>
                  <Progress value={insights.teamHealth.efficiency} className="mt-2" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="font-semibold text-green-800 mb-2">Pontos Positivos</h4>
                  <ul className="space-y-1">
                    {insights.teamHealth.factors.positives.map((positive, index) => (
                      <li key={index} className="text-sm text-green-700">• {positive}</li>
                    ))}
                  </ul>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4">
                  <h4 className="font-semibold text-yellow-800 mb-2">Preocupações</h4>
                  <ul className="space-y-1">
                    {insights.teamHealth.factors.concerns.map((concern, index) => (
                      <li key={index} className="text-sm text-yellow-700">• {concern}</li>
                    ))}
                  </ul>
                </div>
                <div className="bg-red-50 rounded-lg p-4">
                  <h4 className="font-semibold text-red-800 mb-2">Questões Críticas</h4>
                  <ul className="space-y-1">
                    {insights.teamHealth.factors.criticalIssues.map((issue, index) => (
                      <li key={index} className="text-sm text-red-700">• {issue}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {insights.performanceAnalysis.map((dev, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <User className="text-blue-600" size={20} />
                      <div>
                        <CardTitle className="text-lg">{dev.name}</CardTitle>
                        <p className="text-sm text-gray-600">{dev.email}</p>
                      </div>
                    </div>
                    <Badge className={getScoreBadgeColor(dev.scores.overall)}>
                      {dev.scores.overall}%
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-gray-600">Produtividade</div>
                        <div className={`text-lg font-semibold ${getScoreColor(dev.scores.productivity)}`}>
                          {dev.scores.productivity}%
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Qualidade</div>
                        <div className={`text-lg font-semibold ${getScoreColor(dev.scores.quality)}`}>
                          {dev.scores.quality}%
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Consistência</div>
                        <div className={`text-lg font-semibold ${getScoreColor(dev.scores.consistency)}`}>
                          {dev.scores.consistency}%
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Colaboração</div>
                        <div className={`text-lg font-semibold ${getScoreColor(dev.scores.collaboration)}`}>
                          {dev.scores.collaboration}%
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Carga de Trabalho</span>
                        <Badge variant={dev.workPattern.workload === 'normal' ? 'default' : 'destructive'}>
                          {dev.workPattern.workload}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Risco de Burnout</span>
                        <span className={`text-sm font-semibold ${getRiskColor(dev.workPattern.burnoutRisk)}`}>
                          {dev.workPattern.burnoutRisk}
                        </span>
                      </div>
                    </div>

                    {dev.recommendations.length > 0 && (
                      <div className="bg-blue-50 rounded-lg p-3">
                        <h5 className="font-semibold text-blue-800 mb-1">Recomendações</h5>
                        <ul className="space-y-1">
                          {dev.recommendations.map((rec, i) => (
                            <li key={i} className="text-sm text-blue-700">• {rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Predictions Tab */}
        <TabsContent value="predictions" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="text-green-600" size={20} />
                  Previsão de Sprint
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">
                      {insights.predictions.sprintPrediction.completionProbability}%
                    </div>
                    <div className="text-sm text-gray-600">Probabilidade de Conclusão</div>
                    <Progress value={insights.predictions.sprintPrediction.completionProbability} className="mt-2" />
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Data Estimada</span>
                      <span className="text-blue-600">
                        {new Date(insights.predictions.sprintPrediction.estimatedCompletionDate).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="font-medium">Confiança</span>
                      <Badge variant={insights.predictions.sprintPrediction.confidence === 'high' ? 'default' : 'secondary'}>
                        {insights.predictions.sprintPrediction.confidence}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="text-blue-600" size={20} />
                  Previsão de Entrega
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {insights.predictions.deliveryForecast.nextSprint}
                      </div>
                      <div className="text-sm text-gray-600">Próximo Sprint</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {insights.predictions.deliveryForecast.nextMonth}
                      </div>
                      <div className="text-sm text-gray-600">Próximo Mês</div>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Confiança da Previsão</span>
                      <span className="text-blue-600">{insights.predictions.deliveryForecast.confidence}%</span>
                    </div>
                    <Progress value={insights.predictions.deliveryForecast.confidence} className="mt-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Risky Tasks */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="text-red-600" size={20} />
                Tarefas de Risco
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {insights.predictions.sprintPrediction.riskyTasks.map((task, index) => (
                  <div key={index} className="border rounded-lg p-3 bg-red-50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <span className="font-medium text-blue-600">{task.key}</span>
                        <span className="text-gray-700">{task.title}</span>
                      </div>
                      <Badge variant={task.riskLevel === 'high' ? 'destructive' : 'secondary'}>
                        {task.riskLevel}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      Responsável: {task.assignee}
                    </div>
                    <div className="text-sm text-red-700">
                      Motivos: {task.reasons.join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Actions Tab */}
        <TabsContent value="actions" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {insights.actionableRecommendations.map((action, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="text-yellow-600" size={20} />
                      {action.title}
                    </CardTitle>
                    <div className="flex gap-2">
                      <Badge variant={action.priority === 'high' ? 'destructive' : 'default'}>
                        {action.priority}
                      </Badge>
                      <Badge variant="outline">{action.category}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-gray-700">{action.description}</p>
                    <div className="bg-blue-50 rounded-lg p-3">
                      <div className="font-semibold text-blue-800 mb-1">Impacto Esperado</div>
                      <p className="text-sm text-blue-700">{action.expectedImpact}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Esforço Necessário</span>
                      <Badge variant={action.effort === 'high' ? 'destructive' : 'default'}>
                        {action.effort}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}