import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, User, Clock, ArrowRight, Bug, CheckCircle2, AlertCircle } from "lucide-react";
import type { JiraIssue, JiraCredentials } from "@/types/jira";
import { useJiraStatusCategories } from "@/hooks/use-jira-data";

interface KanbanBoardProps {
  issues: JiraIssue[];
  credentials: JiraCredentials;
  projectKey: string;
}

interface KanbanColumn {
  id: string;
  title: string;
  statusCategory: string;
  color: string;
  icon: React.ReactNode;
}

const columns: KanbanColumn[] = [
  {
    id: "todo",
    title: "A Fazer",
    statusCategory: "To Do",
    color: "bg-gray-100 border-gray-300",
    icon: <AlertCircle className="text-gray-600" size={16} />
  },
  {
    id: "inprogress",
    title: "Em Andamento",
    statusCategory: "In Progress",
    color: "bg-blue-100 border-blue-300",
    icon: <Clock className="text-blue-600" size={16} />
  },
  {
    id: "done",
    title: "Concluído",
    statusCategory: "Done",
    color: "bg-green-100 border-green-300",
    icon: <CheckCircle2 className="text-green-600" size={16} />
  }
];

function TaskCard({ issue }: { issue: JiraIssue }) {
  const [isOpen, setIsOpen] = useState(false);

  const getIssueTypeColor = (issueType: string) => {
    switch (issueType.toLowerCase()) {
      case "bug":
        return "bg-red-100 text-red-800 border-red-200";
      case "story":
        return "bg-green-100 text-green-800 border-green-200";
      case "task":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "epic":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getStatusHistory = () => {
    const created = new Date(issue.fields.created);
    const updated = new Date(issue.fields.updated);
    const resolved = issue.fields.resolutiondate ? new Date(issue.fields.resolutiondate) : null;

    return [
      { status: "Criado", date: created },
      { status: "Atualizado", date: updated },
      ...(resolved ? [{ status: "Resolvido", date: resolved }] : [])
    ].sort((a, b) => a.date.getTime() - b.date.getTime());
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Card className="cursor-pointer hover:shadow-md transition-shadow mb-3 border border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Badge className={`text-xs px-2 py-1 ${getIssueTypeColor(issue.fields.issuetype.name)}`}>
                  {issue.fields.issuetype.name}
                </Badge>
                <span className="text-xs text-gray-500 font-mono">{issue.key}</span>
              </div>
              {issue.fields.customfield_10016 && (
                <Badge variant="outline" className="text-xs">
                  {issue.fields.customfield_10016} pts
                </Badge>
              )}
            </div>
            
            <h4 className="text-sm font-medium text-gray-900 mb-3">
              {issue.fields.summary}
            </h4>
            
            <div className="flex items-center justify-between text-xs text-gray-600">
              <div className="flex items-center space-x-1">
                <User size={12} />
                <span>{issue.fields.assignee?.displayName || "Não atribuído"}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar size={12} />
                <span>{formatDate(issue.fields.updated)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Badge className={`text-xs px-2 py-1 ${getIssueTypeColor(issue.fields.issuetype.name)}`}>
              {issue.fields.issuetype.name}
            </Badge>
            <span className="font-mono text-sm">{issue.key}</span>
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            {/* Título da tarefa */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {issue.fields.summary}
              </h3>
            </div>

            {/* Informações básicas */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <User size={16} className="text-gray-500" />
                  <span className="text-sm font-medium">Responsável:</span>
                </div>
                <p className="text-sm text-gray-700 ml-6">
                  {issue.fields.assignee?.displayName || "Não atribuído"}
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Badge className="w-4 h-4 rounded-full" style={{ backgroundColor: issue.fields.status.statusCategory.colorName }} />
                  <span className="text-sm font-medium">Status:</span>
                </div>
                <p className="text-sm text-gray-700 ml-6">
                  {issue.fields.status.name}
                </p>
              </div>
            </div>

            {/* Story Points */}
            {issue.fields.customfield_10016 && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">Story Points:</span>
                </div>
                <p className="text-sm text-gray-700">
                  {issue.fields.customfield_10016} pontos
                </p>
              </div>
            )}

            {/* Histórico de evolução do status */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-900 flex items-center space-x-2">
                <Clock size={16} className="text-gray-500" />
                <span>Histórico de Evolução</span>
              </h4>
              
              <div className="space-y-3">
                {getStatusHistory().map((entry, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      {index < getStatusHistory().length - 1 ? (
                        <ArrowRight size={14} className="text-gray-400" />
                      ) : (
                        <CheckCircle2 size={14} className="text-green-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900">
                          {entry.status}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDate(entry.date.toISOString())}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Datas importantes */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div className="space-y-2">
                <span className="text-sm font-medium text-gray-900">Criado em:</span>
                <p className="text-sm text-gray-700">
                  {formatDate(issue.fields.created)}
                </p>
              </div>
              
              <div className="space-y-2">
                <span className="text-sm font-medium text-gray-900">Última atualização:</span>
                <p className="text-sm text-gray-700">
                  {formatDate(issue.fields.updated)}
                </p>
              </div>
            </div>

            {issue.fields.resolutiondate && (
              <div className="space-y-2">
                <span className="text-sm font-medium text-gray-900">Resolvido em:</span>
                <p className="text-sm text-gray-700">
                  {formatDate(issue.fields.resolutiondate)}
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

export function KanbanBoard({ issues, credentials, projectKey }: KanbanBoardProps) {
  // Get dynamic status categories from API
  const { data: statusData, isLoading: statusLoading } = useJiraStatusCategories(credentials, projectKey);
  
  console.log("Status data:", statusData);
  console.log("Total issues:", issues.length);

  // Create dynamic columns based on actual project statuses
  const dynamicColumns = statusData ? [
    {
      id: "todo",
      title: "A Fazer",
      statuses: statusData.statusCategories.todo,
      color: "bg-gray-100 border-gray-300",
      icon: <AlertCircle className="text-gray-600" size={16} />
    },
    {
      id: "inprogress", 
      title: "Em Andamento",
      statuses: statusData.statusCategories.inprogress,
      color: "bg-blue-100 border-blue-300",
      icon: <Clock className="text-blue-600" size={16} />
    },
    {
      id: "done",
      title: "Concluído", 
      statuses: statusData.statusCategories.done,
      color: "bg-green-100 border-green-300",
      icon: <CheckCircle2 className="text-green-600" size={16} />
    }
  ] : columns;

  const getIssuesByStatusCategory = (statusList: any[]) => {
    if (!statusList || statusList.length === 0) return [];
    
    const statusIds = statusList.map(s => s.id);
    return issues.filter(issue => statusIds.includes(issue.fields.status.id));
  };

  const getIssuesByStatus = (statusCategory: string) => {
    if (statusData) {
      // Use dynamic status mapping
      const statusList = statusData.statusCategories[statusCategory.toLowerCase()];
      return getIssuesByStatusCategory(statusList);
    }
    
    // Fallback to original logic
    return issues.filter(issue => {
      const statusCategoryName = issue.fields.status.statusCategory.name;
      const statusName = issue.fields.status.name.toLowerCase();
      
      if (statusCategory === "To Do") {
        return statusCategoryName === "To Do" || 
               statusCategoryName === "new" ||
               statusName.includes("aberto") ||
               statusName.includes("novo") ||
               statusName.includes("backlog") ||
               statusName.includes("to do") ||
               statusName.includes("a fazer");
      } else if (statusCategory === "In Progress") {
        return statusCategoryName === "In Progress" || 
               statusCategoryName === "indeterminate" ||
               statusName.includes("progresso") ||
               statusName.includes("progress") ||
               statusName.includes("desenvolvimento") ||
               statusName.includes("em andamento") ||
               statusName.includes("fazendo") ||
               statusName.includes("doing");
      } else if (statusCategory === "Done") {
        return statusCategoryName === "Done" || 
               statusCategoryName === "complete" ||
               statusName.includes("concluído") ||
               statusName.includes("done") ||
               statusName.includes("fechado") ||
               statusName.includes("resolvido") ||
               statusName.includes("finalizado") ||
               statusName.includes("terminado");
      }
      return false;
    });
  };

  if (statusLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Carregando status do projeto...</p>
        </div>
      </div>
    );
  }

  // Calculate mapped issues count
  const allMappedIssues = dynamicColumns.reduce((acc, col) => {
    const columnIssues = statusData 
      ? getIssuesByStatusCategory(col.statuses)
      : getIssuesByStatus(col.title);
    return acc + columnIssues.length;
  }, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {dynamicColumns.map(column => {
          const columnIssues = statusData 
            ? getIssuesByStatusCategory(column.statuses)
            : getIssuesByStatus(column.title);
          
          return (
            <Card key={column.id} className={`${column.color} min-h-[400px]`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {column.icon}
                    <span>{column.title}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {columnIssues.length}
                  </Badge>
                </CardTitle>
                {statusData && column.statuses.length > 0 && (
                  <div className="text-xs text-gray-600">
                    Status: {column.statuses.map(s => s.name).join(", ")}
                  </div>
                )}
              </CardHeader>
              <CardContent className="pt-0">
                <ScrollArea className="h-[500px] pr-2">
                  {columnIssues.length > 0 ? (
                    columnIssues.map(issue => (
                      <TaskCard key={issue.id} issue={issue} />
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p className="text-sm">Nenhuma tarefa</p>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}