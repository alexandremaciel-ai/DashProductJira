import jsPDF from "jspdf";
import type { ProductivityMetrics, DeveloperProductivity } from "@/types/jira";

export const exportUtils = {
  async exportToPDF(
    metrics: ProductivityMetrics,
    developerData: DeveloperProductivity[],
    projectName: string
  ) {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.width;
    
    // Header
    pdf.setFontSize(20);
    pdf.text("Productivity Report", pageWidth / 2, 20, { align: "center" });
    
    pdf.setFontSize(12);
    pdf.text(`Project: ${projectName}`, 20, 35);
    pdf.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 45);
    
    // Metrics Section
    pdf.setFontSize(16);
    pdf.text("Key Metrics", 20, 65);
    
    let yPos = 80;
    pdf.setFontSize(10);
    
    const metricsData = [
      [`Tasks Delivered`, metrics.tasksDelivered.toString(), `${metrics.tasksDeliveredChange >= 0 ? '+' : ''}${metrics.tasksDeliveredChange}%`],
      [`Team Velocity`, metrics.velocity.toString(), `${metrics.velocityChange >= 0 ? '+' : ''}${metrics.velocityChange}%`],
      [`Avg. Cycle Time`, `${metrics.cycleTime} days`, `${metrics.cycleTimeChange >= 0 ? '+' : ''}${metrics.cycleTimeChange}%`],
      [`Bug Rate`, `${metrics.bugRate}%`, `${metrics.bugRateChange >= 0 ? '+' : ''}${metrics.bugRateChange}%`],
    ];

    metricsData.forEach(([metric, value, change]) => {
      pdf.text(metric, 20, yPos);
      pdf.text(value, 120, yPos);
      pdf.text(change, 160, yPos);
      yPos += 10;
    });

    // Developer Productivity Section
    yPos += 20;
    pdf.setFontSize(16);
    pdf.text("Developer Productivity", 20, yPos);
    
    yPos += 15;
    pdf.setFontSize(10);
    pdf.text("Developer", 20, yPos);
    pdf.text("Issues", 100, yPos);
    pdf.text("Story Points", 140, yPos);
    pdf.text("Avg. Cycle Time", 180, yPos);
    yPos += 5;

    developerData.forEach((dev) => {
      yPos += 10;
      if (yPos > 250) { // New page if needed
        pdf.addPage();
        yPos = 20;
      }
      
      pdf.text(dev.name, 20, yPos);
      pdf.text(dev.issuesResolved.toString(), 100, yPos);
      pdf.text(dev.storyPoints.toString(), 140, yPos);
      pdf.text(`${dev.avgCycleTime} days`, 180, yPos);
    });

    // Save the PDF
    pdf.save(`productivity-report-${projectName}-${new Date().toISOString().split('T')[0]}.pdf`);
  },

  exportToCSV(
    metrics: ProductivityMetrics,
    developerData: DeveloperProductivity[],
    projectName: string
  ) {
    const csvData = [
      ["Productivity Report"],
      [`Project: ${projectName}`],
      [`Generated: ${new Date().toLocaleDateString()}`],
      [""],
      ["Key Metrics"],
      ["Metric", "Value", "Change"],
      ["Tasks Delivered", metrics.tasksDelivered.toString(), `${metrics.tasksDeliveredChange}%`],
      ["Team Velocity", metrics.velocity.toString(), `${metrics.velocityChange}%`],
      ["Avg. Cycle Time", `${metrics.cycleTime} days`, `${metrics.cycleTimeChange}%`],
      ["Bug Rate", `${metrics.bugRate}%`, `${metrics.bugRateChange}%`],
      [""],
      ["Developer Productivity"],
      ["Developer", "Issues Resolved", "Story Points", "Avg. Cycle Time"],
      ...developerData.map(dev => [
        dev.name,
        dev.issuesResolved.toString(),
        dev.storyPoints.toString(),
        `${dev.avgCycleTime} days`
      ])
    ];

    const csvContent = csvData.map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `productivity-report-${projectName}-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  },
};
