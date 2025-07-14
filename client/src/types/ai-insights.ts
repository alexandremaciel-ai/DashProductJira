// Tipos avançados para análises de IA
export interface DeveloperPerformance {
  accountId: string;
  name: string;
  email: string;
  scores: {
    productivity: number; // 0-100
    quality: number; // 0-100
    consistency: number; // 0-100
    collaboration: number; // 0-100
    overall: number; // 0-100
  };
  metrics: {
    tasksCompleted: number;
    avgCycleTime: number;
    bugRate: number;
    codeReviewParticipation: number;
  };
  trends: {
    lastWeek: number;
    lastMonth: number;
    direction: "up" | "down" | "stable";
  };
  insights: string[];
  recommendations: string[];
  workPattern: {
    peakHours: string;
    mostProductiveDays: string[];
    workload: "normal" | "overloaded" | "underutilized";
    burnoutRisk: "low" | "medium" | "high";
  };
}

export interface TeamHealthMetrics {
  overallHealth: number; // 0-100
  morale: number; // 0-100
  burnoutRisk: number; // 0-100
  collaboration: number; // 0-100
  efficiency: number; // 0-100
  factors: {
    positives: string[];
    concerns: string[];
    criticalIssues: string[];
  };
  recommendations: string[];
}

export interface PredictiveAnalysis {
  sprintPrediction: {
    completionProbability: number; // 0-100
    estimatedCompletionDate: string;
    confidence: "low" | "medium" | "high";
    riskyTasks: {
      key: string;
      title: string;
      assignee: string;
      riskLevel: "low" | "medium" | "high";
      reasons: string[];
    }[];
  };
  deliveryForecast: {
    nextSprint: number; // estimated story points
    nextMonth: number;
    confidence: number; // 0-100
  };
  qualityTrends: {
    bugRateTrend: "improving" | "stable" | "degrading";
    codeQualityTrend: "improving" | "stable" | "degrading";
    predictions: string[];
  };
  resourceOptimization: {
    overloadedMembers: string[];
    underutilizedMembers: string[];
    suggestedReassignments: {
      from: string;
      to: string;
      tasks: string[];
    }[];
  };
}

export interface AnomalyDetection {
  detected: boolean;
  anomalies: {
    type: "velocity" | "cycle_time" | "bug_rate" | "productivity";
    severity: "low" | "medium" | "high";
    description: string;
    affectedMembers: string[];
    suggestedActions: string[];
  }[];
  alerts: {
    type: "info" | "warning" | "critical";
    title: string;
    message: string;
    action: string;
  }[];
}

export interface IntelligentInsights {
  summary: string;
  keyFindings: string[];
  performanceAnalysis: DeveloperPerformance[];
  teamHealth: TeamHealthMetrics;
  predictions: PredictiveAnalysis;
  anomalies: AnomalyDetection;
  actionableRecommendations: {
    priority: "high" | "medium" | "low";
    category: "performance" | "quality" | "process" | "team";
    title: string;
    description: string;
    expectedImpact: string;
    effort: "low" | "medium" | "high";
  }[];
}

export interface AIConfiguration {
  analysisDepth: "basic" | "advanced" | "comprehensive";
  includeIndividualAnalysis: boolean;
  includePredictiveAnalysis: boolean;
  includeAnomalyDetection: boolean;
  includeTeamHealthAnalysis: boolean;
  confidenceThreshold: number; // 0-100
  alertSensitivity: "low" | "medium" | "high";
}