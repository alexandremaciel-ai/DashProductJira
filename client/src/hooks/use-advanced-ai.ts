import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import type { 
  IntelligentInsights, 
  DeveloperPerformance, 
  TeamHealthMetrics,
  PredictiveAnalysis,
  AnomalyDetection,
  AIConfiguration
} from "@/types/ai-insights";
import type { JiraIssue, JiraCredentials, ProductivityMetrics } from "@/types/jira";

// Simulação de dados para demonstração
const generateMockInsights = (issues: JiraIssue[], metrics: ProductivityMetrics): IntelligentInsights => {
  // Análise de desenvolvedores
  const developers = Array.from(new Set(
    issues
      .filter(i => i.fields.assignee)
      .map(i => i.fields.assignee!)
  )).map(assignee => {
    const devIssues = issues.filter(i => i.fields.assignee?.accountId === assignee.accountId);
    const completedIssues = devIssues.filter(i => i.fields.status.statusCategory.key === "done");
    
    const avgCycleTime = completedIssues.length > 0 
      ? completedIssues.reduce((acc, issue) => {
          const created = new Date(issue.fields.created);
          const resolved = new Date(issue.fields.resolutiondate || issue.fields.updated);
          return acc + (resolved.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
        }, 0) / completedIssues.length
      : 0;

    const bugCount = devIssues.filter(i => 
      i.fields.issuetype.name.toLowerCase().includes('bug')
    ).length;

    const productivity = Math.min(100, Math.max(0, 70 + (completedIssues.length - 5) * 5));
    const quality = Math.min(100, Math.max(0, 90 - (bugCount * 10)));
    const consistency = Math.min(100, Math.max(0, 80 - (avgCycleTime - 5) * 5));
    const collaboration = Math.min(100, Math.max(0, 75 + Math.random() * 25));

    return {
      accountId: assignee.accountId,
      name: assignee.displayName,
      email: assignee.emailAddress,
      scores: {
        productivity,
        quality,
        consistency,
        collaboration,
        overall: Math.round((productivity + quality + consistency + collaboration) / 4)
      },
      metrics: {
        tasksCompleted: completedIssues.length,
        avgCycleTime: Math.round(avgCycleTime),
        bugRate: devIssues.length > 0 ? Math.round((bugCount / devIssues.length) * 100) : 0,
        codeReviewParticipation: Math.round(Math.random() * 100)
      },
      trends: {
        lastWeek: Math.round(Math.random() * 20 - 10),
        lastMonth: Math.round(Math.random() * 30 - 15),
        direction: Math.random() > 0.5 ? "up" : (Math.random() > 0.5 ? "down" : "stable")
      },
      insights: [
        `Completou ${completedIssues.length} tarefas recentemente`,
        `Tempo médio de ciclo: ${Math.round(avgCycleTime)} dias`,
        avgCycleTime > 7 ? "Ciclo de desenvolvimento está acima da média" : "Bom ritmo de desenvolvimento"
      ],
      recommendations: productivity < 60 ? [
        "Revisar carga de trabalho atual",
        "Considerar pair programming para acelerar desenvolvimento"
      ] : [
        "Manter o bom ritmo de trabalho",
        "Considerar mentoria para outros desenvolvedores"
      ],
      workPattern: {
        peakHours: "09:00-11:00",
        mostProductiveDays: ["Segunda", "Terça", "Quarta"],
        workload: completedIssues.length > 8 ? "overloaded" : (completedIssues.length < 3 ? "underutilized" : "normal"),
        burnoutRisk: completedIssues.length > 10 ? "high" : (completedIssues.length > 6 ? "medium" : "low")
      }
    } as DeveloperPerformance;
  });

  // Análise de saúde da equipe
  const teamHealth: TeamHealthMetrics = {
    overallHealth: Math.round(developers.reduce((acc, dev) => acc + dev.scores.overall, 0) / developers.length),
    morale: Math.round(75 + Math.random() * 20),
    burnoutRisk: Math.round(Math.random() * 40),
    collaboration: Math.round(developers.reduce((acc, dev) => acc + dev.scores.collaboration, 0) / developers.length),
    efficiency: Math.round(metrics.velocity * 10),
    factors: {
      positives: [
        "Equipe mantém boa comunicação",
        "Entregas consistentes",
        "Boa qualidade de código"
      ],
      concerns: [
        "Alguns desenvolvedores com carga alta",
        "Cycle time variável entre membros"
      ],
      criticalIssues: developers.filter(d => d.workPattern.burnoutRisk === "high").length > 0 ? [
        "Desenvolvedores com alto risco de burnout identificados"
      ] : []
    },
    recommendations: [
      "Implementar rotação de tarefas complexas",
      "Considerar sessões de pair programming",
      "Revisar distribuição de carga de trabalho"
    ]
  };

  // Previsões
  const predictions: PredictiveAnalysis = {
    sprintPrediction: {
      completionProbability: Math.round(70 + Math.random() * 25),
      estimatedCompletionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      confidence: Math.random() > 0.7 ? "high" : (Math.random() > 0.3 ? "medium" : "low"),
      riskyTasks: issues
        .filter(i => i.fields.status.statusCategory.key !== "done")
        .slice(0, 3)
        .map(task => ({
          key: task.key,
          title: task.fields.summary,
          assignee: task.fields.assignee?.displayName || "Não atribuído",
          riskLevel: Math.random() > 0.7 ? "high" : (Math.random() > 0.3 ? "medium" : "low"),
          reasons: ["Complexidade alta", "Dependências externas", "Histórico de atrasos"]
        }))
    },
    deliveryForecast: {
      nextSprint: Math.round(metrics.velocity * 0.9),
      nextMonth: Math.round(metrics.velocity * 3.5),
      confidence: Math.round(60 + Math.random() * 30)
    },
    qualityTrends: {
      bugRateTrend: metrics.bugRate > 15 ? "degrading" : (metrics.bugRate < 5 ? "improving" : "stable"),
      codeQualityTrend: "stable",
      predictions: [
        `Taxa de bugs pode ${metrics.bugRate > 15 ? "aumentar" : "diminuir"} nas próximas semanas`,
        "Qualidade do código mantém-se estável"
      ]
    },
    resourceOptimization: {
      overloadedMembers: developers.filter(d => d.workPattern.workload === "overloaded").map(d => d.name),
      underutilizedMembers: developers.filter(d => d.workPattern.workload === "underutilized").map(d => d.name),
      suggestedReassignments: []
    }
  };

  // Detecção de anomalias
  const anomalies: AnomalyDetection = {
    detected: metrics.bugRate > 20 || metrics.cycleTime > 10,
    anomalies: [
      ...(metrics.bugRate > 20 ? [{
        type: "bug_rate" as const,
        severity: "high" as const,
        description: "Taxa de bugs significativamente acima do normal",
        affectedMembers: developers.filter(d => d.metrics.bugRate > 20).map(d => d.name),
        suggestedActions: ["Revisar processo de QA", "Implementar mais testes automatizados"]
      }] : []),
      ...(metrics.cycleTime > 10 ? [{
        type: "cycle_time" as const,
        severity: "medium" as const,
        description: "Tempo de ciclo acima da média histórica",
        affectedMembers: developers.filter(d => d.metrics.avgCycleTime > 10).map(d => d.name),
        suggestedActions: ["Revisar complexidade das tarefas", "Considerar pair programming"]
      }] : [])
    ],
    alerts: [
      ...(metrics.bugRate > 20 ? [{
        type: "critical" as const,
        title: "Alta Taxa de Bugs",
        message: "A taxa de bugs está 40% acima do normal",
        action: "Revisar processos de qualidade imediatamente"
      }] : []),
      ...(predictions.sprintPrediction.completionProbability < 60 ? [{
        type: "warning" as const,
        title: "Risco de Atraso no Sprint",
        message: "Baixa probabilidade de conclusão do sprint atual",
        action: "Considerar repriorização de tarefas"
      }] : [])
    ]
  };

  return {
    summary: `Análise de ${issues.length} issues e ${developers.length} desenvolvedores. A equipe demonstra ${teamHealth.overallHealth}% de saúde geral, com ${predictions.sprintPrediction.completionProbability}% de probabilidade de conclusão do sprint atual.`,
    keyFindings: [
      `Velocity média de ${metrics.velocity} story points`,
      `Tempo médio de ciclo: ${metrics.cycleTime} dias`,
      `Taxa de bugs: ${metrics.bugRate}%`,
      `${developers.length} desenvolvedores ativos no período`
    ],
    performanceAnalysis: developers,
    teamHealth,
    predictions,
    anomalies,
    actionableRecommendations: [
      {
        priority: "high",
        category: "performance",
        title: "Otimizar Distribuição de Tarefas",
        description: "Redistribuir tarefas para equilibrar carga de trabalho entre desenvolvedores",
        expectedImpact: "Redução de 15% no tempo médio de ciclo",
        effort: "medium"
      },
      {
        priority: "medium",
        category: "quality",
        title: "Implementar Code Review Sistemático",
        description: "Estabelecer processo obrigatório de revisão de código",
        expectedImpact: "Redução de 25% na taxa de bugs",
        effort: "low"
      },
      {
        priority: "low",
        category: "process",
        title: "Automação de Testes",
        description: "Implementar testes automatizados para principais funcionalidades",
        expectedImpact: "Melhoria de 30% na qualidade do código",
        effort: "high"
      }
    ]
  };
};

export function useAdvancedAI(
  issues: JiraIssue[],
  metrics: ProductivityMetrics,
  credentials: JiraCredentials | null,
  projectKey: string,
  isEnabled: boolean,
  config: AIConfiguration = {
    analysisDepth: "advanced",
    includeIndividualAnalysis: true,
    includePredictiveAnalysis: true,
    includeAnomalyDetection: true,
    includeTeamHealthAnalysis: true,
    confidenceThreshold: 70,
    alertSensitivity: "medium"
  }
) {
  const [insights, setInsights] = useState<IntelligentInsights | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Simulação de processamento com delay
  useEffect(() => {
    if (isEnabled && issues.length > 0 && metrics.tasksDelivered > 0) {
      setIsProcessing(true);
      
      const timer = setTimeout(() => {
        const mockInsights = generateMockInsights(issues, metrics);
        setInsights(mockInsights);
        setIsProcessing(false);
      }, 2000); // Simula 2 segundos de processamento

      return () => clearTimeout(timer);
    }
  }, [isEnabled, issues, metrics]);

  const refreshInsights = () => {
    if (isEnabled && issues.length > 0) {
      setIsProcessing(true);
      
      setTimeout(() => {
        const mockInsights = generateMockInsights(issues, metrics);
        setInsights(mockInsights);
        setIsProcessing(false);
      }, 1500);
    }
  };

  return {
    insights,
    isLoading: isProcessing,
    refreshInsights,
    isEnabled
  };
}

// Hook para configurações de IA
export function useAIConfiguration() {
  const [config, setConfig] = useState<AIConfiguration>({
    analysisDepth: "advanced",
    includeIndividualAnalysis: true,
    includePredictiveAnalysis: true,
    includeAnomalyDetection: true,
    includeTeamHealthAnalysis: true,
    confidenceThreshold: 70,
    alertSensitivity: "medium"
  });

  const updateConfig = (newConfig: Partial<AIConfiguration>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  };

  return {
    config,
    updateConfig
  };
}