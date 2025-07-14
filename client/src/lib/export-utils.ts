import jsPDF from "jspdf";
import type { ProductivityMetrics, JiraIssue, DashboardFilters } from "@/types/jira";

interface ExportData {
  metrics: ProductivityMetrics;
  issues: JiraIssue[];
  completedTasks: JiraIssue[];
  projectName: string;
  filters: DashboardFilters;
  aiInsights?: any;
}

interface TeamMemberStats {
  name: string;
  email: string;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  todoTasks: number;
  avgCycleTime: number;
  productivity: number;
  issueTypes: { [key: string]: number };
}

export const exportUtils = {
  // Função para calcular estatísticas detalhadas da equipe
  calculateTeamStats(issues: JiraIssue[]): TeamMemberStats[] {
    const teamStats: { [key: string]: TeamMemberStats } = {};
    
    issues.forEach(issue => {
      const assignee = issue.fields.assignee;
      if (!assignee) return;
      
      const key = assignee.accountId || assignee.emailAddress || assignee.displayName;
      if (!teamStats[key]) {
        teamStats[key] = {
          name: assignee.displayName || 'N/A',
          email: assignee.emailAddress || 'N/A',
          totalTasks: 0,
          completedTasks: 0,
          inProgressTasks: 0,
          todoTasks: 0,
          avgCycleTime: 0,
          productivity: 0,
          issueTypes: {}
        };
      }
      
      const stats = teamStats[key];
      stats.totalTasks++;
      
      // Contabilizar por status
      const statusCategory = issue.fields.status.statusCategory.key;
      if (statusCategory === 'done') {
        stats.completedTasks++;
      } else if (statusCategory === 'indeterminate') {
        stats.inProgressTasks++;
      } else {
        stats.todoTasks++;
      }
      
      // Contabilizar por tipo de issue
      const issueType = issue.fields.issuetype.name;
      stats.issueTypes[issueType] = (stats.issueTypes[issueType] || 0) + 1;
      
      // Calcular tempo de ciclo se resolvida
      if (issue.fields.resolutiondate) {
        const createdDate = new Date(issue.fields.created);
        const resolvedDate = new Date(issue.fields.resolutiondate);
        const cycleTime = Math.ceil((resolvedDate.getTime() - createdDate.getTime()) / (1000 * 3600 * 24));
        stats.avgCycleTime = stats.avgCycleTime === 0 ? cycleTime : (stats.avgCycleTime + cycleTime) / 2;
      }
    });
    
    // Calcular produtividade (tarefas concluídas / total de tarefas)
    Object.values(teamStats).forEach(stats => {
      stats.productivity = stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0;
      stats.avgCycleTime = Math.round(stats.avgCycleTime);
    });
    
    return Object.values(teamStats).sort((a, b) => b.productivity - a.productivity);
  },

  // Função para gerar dados do gráfico de burndown
  generateBurndownData(issues: JiraIssue[]): { date: string; remaining: number; completed: number }[] {
    const dailyData: { [key: string]: { remaining: number; completed: number } } = {};
    
    // Obter datas relevantes
    const today = new Date();
    const startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 dias atrás
    
    // Inicializar dados diários
    for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      dailyData[dateStr] = { remaining: 0, completed: 0 };
    }
    
    // Processar issues
    issues.forEach(issue => {
      const createdDate = new Date(issue.fields.created);
      const resolvedDate = issue.fields.resolutiondate ? new Date(issue.fields.resolutiondate) : null;
      
      // Contar como remaining até ser resolvida
      for (let d = new Date(Math.max(createdDate.getTime(), startDate.getTime())); d <= today; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        if (dailyData[dateStr] && (!resolvedDate || d <= resolvedDate)) {
          dailyData[dateStr].remaining++;
        }
      }
      
      // Contar como completed na data de resolução
      if (resolvedDate && resolvedDate >= startDate) {
        const dateStr = resolvedDate.toISOString().split('T')[0];
        if (dailyData[dateStr]) {
          dailyData[dateStr].completed++;
        }
      }
    });
    
    return Object.entries(dailyData).map(([date, data]) => ({
      date,
      remaining: data.remaining,
      completed: data.completed
    }));
  },

  // Exportação CSV avançada
  exportToCSV(exportData: ExportData) {
    const { metrics, issues, completedTasks, projectName, filters, aiInsights } = exportData;
    const teamStats = this.calculateTeamStats(issues);
    const burndownData = this.generateBurndownData(issues);
    
    const csvData: string[][] = [
      ["🚀 RELATÓRIO DE PRODUTIVIDADE JIRA - DASHPRODUCT"],
      [""],
      ["📊 INFORMAÇÕES GERAIS"],
      ["Projeto", projectName],
      ["Data de Geração", new Date().toLocaleDateString('pt-BR', { dateStyle: 'full' })],
      ["Período Analisado", this.getPeriodDescription(filters.timePeriod)],
      ["Total de Issues", issues.length.toString()],
      ["Issues Concluídas", completedTasks.length.toString()],
      ["Taxa de Conclusão", `${Math.round((completedTasks.length / issues.length) * 100)}%`],
      [""],
      ["📈 MÉTRICAS PRINCIPAIS"],
      ["Métrica", "Valor", "Mudança"],
      ["Tarefas Entregues", metrics.tasksDelivered.toString(), `${metrics.tasksDeliveredChange >= 0 ? '+' : ''}${metrics.tasksDeliveredChange}%`],
      ["Velocidade da Equipe", metrics.velocity.toString(), `${metrics.velocityChange >= 0 ? '+' : ''}${metrics.velocityChange}%`],
      ["Tempo de Ciclo Médio", `${metrics.cycleTime} dias`, `${metrics.cycleTimeChange >= 0 ? '+' : ''}${metrics.cycleTimeChange}%`],
      ["Taxa de Bugs", `${metrics.bugRate}%`, `${metrics.bugRateChange >= 0 ? '+' : ''}${metrics.bugRateChange}%`],
      [""],
      ["👥 PRODUTIVIDADE DA EQUIPE"],
      ["Nome", "Email", "Total Tarefas", "Concluídas", "Em Andamento", "A Fazer", "Produtividade (%)", "Tempo Ciclo Médio (dias)"],
      ...teamStats.map(member => [
        member.name,
        member.email,
        member.totalTasks.toString(),
        member.completedTasks.toString(),
        member.inProgressTasks.toString(),
        member.todoTasks.toString(),
        `${member.productivity}%`,
        `${member.avgCycleTime}`
      ]),
      [""],
      ["📋 DETALHES DAS TAREFAS CONCLUÍDAS"],
      ["Chave", "Título", "Tipo", "Responsável", "Data Criação", "Data Resolução", "Tempo Resolução (dias)"],
      ...completedTasks.map(task => {
        const createdDate = new Date(task.fields.created);
        const resolvedDate = new Date(task.fields.resolutiondate || task.fields.updated);
        const resolutionTime = Math.ceil((resolvedDate.getTime() - createdDate.getTime()) / (1000 * 3600 * 24));
        
        return [
          task.key,
          task.fields.summary,
          task.fields.issuetype.name,
          task.fields.assignee?.displayName || 'Não atribuído',
          createdDate.toLocaleDateString('pt-BR'),
          resolvedDate.toLocaleDateString('pt-BR'),
          resolutionTime.toString()
        ];
      }),
      [""],
      ["📊 ANÁLISE DE TIPOS DE ISSUE"],
      ["Tipo", "Quantidade", "Percentual"],
      ...this.getIssueTypeStats(issues).map(stat => [
        stat.type,
        stat.count.toString(),
        `${stat.percentage}%`
      ]),
      [""],
      ["📈 BURNDOWN DOS ÚLTIMOS 30 DIAS"],
      ["Data", "Tarefas Restantes", "Tarefas Concluídas"],
      ...burndownData.map(data => [
        data.date,
        data.remaining.toString(),
        data.completed.toString()
      ])
    ];
    
    // Adicionar insights da IA se disponível
    if (aiInsights) {
      csvData.push(
        [""],
        ["🤖 INSIGHTS DA IA"],
        ["Categoria", "Insight"],
        ["Análise Geral", aiInsights.summary || 'N/A'],
        ["Recomendações", aiInsights.recommendations?.join('; ') || 'N/A'],
        ["Pontos de Atenção", aiInsights.alerts?.join('; ') || 'N/A']
      );
    }
    
    const csvContent = csvData.map(row => 
      row.map(cell => `"${cell.toString().replace(/"/g, '""')}"`).join(',')
    ).join('\n');
    
    const BOM = '\uFEFF'; // UTF-8 BOM para suporte a caracteres especiais
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `relatorio-produtividade-${projectName.replace(/[^a-zA-Z0-9]/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  },

  // Exportação PDF avançada
  async exportToPDF(exportData: ExportData) {
    const { metrics, issues, completedTasks, projectName, filters, aiInsights } = exportData;
    const teamStats = this.calculateTeamStats(issues);
    
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.width;
    const pageHeight = pdf.internal.pageSize.height;
    let yPos = 20;
    
    // Função para verificar se precisa de nova página
    const checkNewPage = (requiredSpace: number = 20) => {
      if (yPos + requiredSpace > pageHeight - 20) {
        pdf.addPage();
        yPos = 20;
      }
    };
    
    // Cabeçalho
    pdf.setFontSize(22);
    pdf.setTextColor(59, 130, 246); // Azul
    pdf.text('🚀 RELATÓRIO DE PRODUTIVIDADE', pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;
    
    pdf.setFontSize(16);
    pdf.setTextColor(0, 0, 0);
    pdf.text('DashProduct - Jira Analytics', pageWidth / 2, yPos, { align: 'center' });
    yPos += 20;
    
    // Informações do projeto
    pdf.setFontSize(12);
    pdf.text(`📊 Projeto: ${projectName}`, 20, yPos);
    yPos += 8;
    pdf.text(`📅 Data: ${new Date().toLocaleDateString('pt-BR', { dateStyle: 'full' })}`, 20, yPos);
    yPos += 8;
    pdf.text(`⏱️ Período: ${this.getPeriodDescription(filters.timePeriod)}`, 20, yPos);
    yPos += 8;
    pdf.text(`📈 Total de Issues: ${issues.length} | Concluídas: ${completedTasks.length}`, 20, yPos);
    yPos += 20;
    
    // Métricas principais
    checkNewPage(60);
    pdf.setFontSize(16);
    pdf.setTextColor(59, 130, 246);
    pdf.text('📈 MÉTRICAS PRINCIPAIS', 20, yPos);
    yPos += 15;
    
    // Criar tabela de métricas
    const metricsData = [
      ['Tarefas Entregues', metrics.tasksDelivered.toString(), `${metrics.tasksDeliveredChange >= 0 ? '+' : ''}${metrics.tasksDeliveredChange}%`],
      ['Velocidade da Equipe', metrics.velocity.toString(), `${metrics.velocityChange >= 0 ? '+' : ''}${metrics.velocityChange}%`],
      ['Tempo de Ciclo Médio', `${metrics.cycleTime} dias`, `${metrics.cycleTimeChange >= 0 ? '+' : ''}${metrics.cycleTimeChange}%`],
      ['Taxa de Bugs', `${metrics.bugRate}%`, `${metrics.bugRateChange >= 0 ? '+' : ''}${metrics.bugRateChange}%`]
    ];
    
    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);
    
    // Cabeçalho da tabela
    pdf.setFontSize(10);
    pdf.text('Métrica', 20, yPos);
    pdf.text('Valor', 100, yPos);
    pdf.text('Mudança', 150, yPos);
    yPos += 8;
    
    // Linha separadora
    pdf.line(20, yPos - 2, pageWidth - 20, yPos - 2);
    
    metricsData.forEach(([metric, value, change]) => {
      pdf.text(metric, 20, yPos);
      pdf.text(value, 100, yPos);
      
      // Colorir mudança positiva/negativa
      if (change.startsWith('+')) {
        pdf.setTextColor(34, 197, 94); // Verde
      } else if (change.startsWith('-')) {
        pdf.setTextColor(239, 68, 68); // Vermelho
      }
      pdf.text(change, 150, yPos);
      pdf.setTextColor(0, 0, 0);
      yPos += 8;
    });
    
    yPos += 15;
    
    // Produtividade da equipe
    checkNewPage(80);
    pdf.setFontSize(16);
    pdf.setTextColor(59, 130, 246);
    pdf.text('👥 PRODUTIVIDADE DA EQUIPE', 20, yPos);
    yPos += 15;
    
    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);
    
    // Cabeçalho da tabela de equipe
    pdf.text('Membro', 20, yPos);
    pdf.text('Total', 80, yPos);
    pdf.text('Concluídas', 110, yPos);
    pdf.text('Produtividade', 150, yPos);
    yPos += 8;
    
    pdf.line(20, yPos - 2, pageWidth - 20, yPos - 2);
    
    teamStats.slice(0, 15).forEach(member => {
      checkNewPage();
      pdf.text(member.name.length > 20 ? member.name.substring(0, 20) + '...' : member.name, 20, yPos);
      pdf.text(member.totalTasks.toString(), 80, yPos);
      pdf.text(member.completedTasks.toString(), 110, yPos);
      pdf.text(`${member.productivity}%`, 150, yPos);
      yPos += 8;
    });
    
    yPos += 15;
    
    // Análise de tipos de issue
    checkNewPage(60);
    pdf.setFontSize(16);
    pdf.setTextColor(59, 130, 246);
    pdf.text('📊 ANÁLISE DE TIPOS DE ISSUE', 20, yPos);
    yPos += 15;
    
    const issueTypeStats = this.getIssueTypeStats(issues);
    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);
    
    issueTypeStats.forEach(stat => {
      checkNewPage();
      pdf.text(`${stat.type}: ${stat.count} (${stat.percentage}%)`, 20, yPos);
      yPos += 8;
    });
    
    // Adicionar insights da IA se disponível
    if (aiInsights) {
      yPos += 15;
      checkNewPage(60);
      pdf.setFontSize(16);
      pdf.setTextColor(59, 130, 246);
      pdf.text('🤖 INSIGHTS DA IA', 20, yPos);
      yPos += 15;
      
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      
      if (aiInsights.summary) {
        pdf.text('Análise Geral:', 20, yPos);
        yPos += 8;
        const summaryLines = pdf.splitTextToSize(aiInsights.summary, pageWidth - 40);
        summaryLines.forEach((line: string) => {
          checkNewPage();
          pdf.text(line, 30, yPos);
          yPos += 6;
        });
        yPos += 5;
      }
      
      if (aiInsights.recommendations) {
        pdf.text('Recomendações:', 20, yPos);
        yPos += 8;
        aiInsights.recommendations.forEach((rec: string) => {
          checkNewPage();
          pdf.text(`• ${rec}`, 30, yPos);
          yPos += 6;
        });
      }
    }
    
    // Rodapé
    const totalPages = pdf.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setTextColor(128, 128, 128);
      pdf.text(`Página ${i} de ${totalPages}`, pageWidth - 30, pageHeight - 10);
      pdf.text('Gerado por DashProduct - Jira Analytics', 20, pageHeight - 10);
    }
    
    // Salvar PDF
    pdf.save(`relatorio-produtividade-${projectName.replace(/[^a-zA-Z0-9]/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`);
  },

  // Gerar relatório completo (CSV + PDF)
  async generateReport(exportData: ExportData) {
    const { projectName } = exportData;
    
    // Mostrar notificação de progresso
    const notification = document.createElement('div');
    notification.innerHTML = `
      <div style="position: fixed; top: 20px; right: 20px; background: #3B82F6; color: white; padding: 16px; border-radius: 8px; z-index: 9999; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="width: 20px; height: 20px; border: 2px solid #ffffff; border-top: 2px solid transparent; border-radius: 50%; animation: spin 1s linear infinite;"></div>
          <div>
            <div style="font-weight: bold;">🚀 Gerando Relatório Completo</div>
            <div style="font-size: 12px; opacity: 0.9;">Criando arquivos CSV e PDF...</div>
          </div>
        </div>
      </div>
      <style>
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    `;
    document.body.appendChild(notification);
    
    try {
      // Gerar CSV
      this.exportToCSV(exportData);
      
      // Aguardar um pouco antes de gerar o PDF
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Gerar PDF
      await this.exportToPDF(exportData);
      
      // Remover notificação e mostrar sucesso
      document.body.removeChild(notification);
      
      const successNotification = document.createElement('div');
      successNotification.innerHTML = `
        <div style="position: fixed; top: 20px; right: 20px; background: #10B981; color: white; padding: 16px; border-radius: 8px; z-index: 9999; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="font-size: 20px;">✅</div>
            <div>
              <div style="font-weight: bold;">Relatório Gerado com Sucesso!</div>
              <div style="font-size: 12px; opacity: 0.9;">Arquivos CSV e PDF baixados</div>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(successNotification);
      
      setTimeout(() => {
        document.body.removeChild(successNotification);
      }, 5000);
      
    } catch (error) {
      document.body.removeChild(notification);
      console.error('Erro ao gerar relatório:', error);
      
      const errorNotification = document.createElement('div');
      errorNotification.innerHTML = `
        <div style="position: fixed; top: 20px; right: 20px; background: #EF4444; color: white; padding: 16px; border-radius: 8px; z-index: 9999; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="font-size: 20px;">❌</div>
            <div>
              <div style="font-weight: bold;">Erro ao Gerar Relatório</div>
              <div style="font-size: 12px; opacity: 0.9;">Tente novamente em alguns instantes</div>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(errorNotification);
      
      setTimeout(() => {
        document.body.removeChild(errorNotification);
      }, 5000);
    }
  },

  // Funções auxiliares
  getPeriodDescription(timePeriod: string): string {
    switch (timePeriod) {
      case 'week': return 'Esta semana';
      case 'month': return 'Este mês';
      case 'quarter': return 'Este trimestre';
      case 'custom': return 'Período personalizado';
      case 'all':
      default: return 'Todo o período';
    }
  },

  getIssueTypeStats(issues: JiraIssue[]): { type: string; count: number; percentage: number }[] {
    const typeCount: { [key: string]: number } = {};
    
    issues.forEach(issue => {
      const type = issue.fields.issuetype.name;
      typeCount[type] = (typeCount[type] || 0) + 1;
    });
    
    return Object.entries(typeCount)
      .map(([type, count]) => ({
        type,
        count,
        percentage: Math.round((count / issues.length) * 100)
      }))
      .sort((a, b) => b.count - a.count);
  }
};
