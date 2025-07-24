import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, Save, X, Calendar, Info } from "lucide-react";
import type { JiraIssue } from "@/types/jira";

interface TotalTasksCardProps {
  title: string;
  icon: React.ReactNode;
  description: string;
  iconBgColor: string;
  allIssues: JiraIssue[];
  isFlipped?: boolean;
  onFlip?: () => void;
}

interface DateFilter {
  type: 'all' | 'last7days' | 'last30days' | 'last90days' | 'thisYear' | 'custom';
  startDate?: string;
  endDate?: string;
}

export function TotalTasksCard({
  title,
  icon,
  description,
  iconBgColor,
  allIssues,
  isFlipped = false,
  onFlip
}: TotalTasksCardProps) {
  const [dateFilter, setDateFilter] = useState<DateFilter>({ type: 'all' });

  // Calculate filtered issues based on date filter
  const getFilteredIssues = () => {
    if (dateFilter.type === 'all') {
      return allIssues;
    }

    const now = new Date();
    let filterDate: Date;

    switch (dateFilter.type) {
      case 'last7days':
        filterDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'last30days':
        filterDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'last90days':
        filterDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'thisYear':
        filterDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        return allIssues;
    }

    return allIssues.filter(issue => {
      const createdDate = new Date(issue.fields.created);
      return createdDate >= filterDate;
    });
  };

  const filteredIssues = getFilteredIssues();
  const totalTasks = filteredIssues.length;

  const handleFlip = () => {
    if (onFlip) {
      onFlip();
    }
  };

  const handleClose = () => {
    if (onFlip) {
      onFlip();
    }
  };

  const getDateFilterLabel = () => {
    switch (dateFilter.type) {
      case 'all':
        return 'Todo o período';
      case 'last7days':
        return 'Últimos 7 dias';
      case 'last30days':
        return 'Últimos 30 dias';
      case 'last90days':
        return 'Últimos 90 dias';
      case 'thisYear':
        return 'Este ano';
      default:
        return 'Todo o período';
    }
  };

  return (
    <TooltipProvider>
      <div className={`relative w-full transition-all duration-700 perspective-1000 ${
        isFlipped ? 'h-auto min-h-[400px]' : 'h-52'
      }`}>
        <div
          className={`relative w-full transition-transform duration-700 transform-style-preserve-3d ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
          style={{ height: isFlipped ? 'auto' : '208px' }}
        >
          {/* Front of card */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Card 
                className={`w-full backface-hidden cursor-pointer hover:shadow-xl transition-all duration-300 border border-gray-200 bg-gradient-to-br from-white to-blue-50/30 hover:from-blue-50/20 hover:to-blue-100/40 ${
                  isFlipped ? 'absolute' : 'relative'
                }`}
                onClick={handleFlip}
                style={{ height: isFlipped ? '208px' : 'auto' }}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className={`w-14 h-14 ${iconBgColor} rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg`}>
                      {icon}
                    </div>
                    <div className="text-right">
                      <div className="text-4xl font-bold text-gray-900 mb-1">{totalTasks}</div>
                      {dateFilter.type !== 'all' && (
                        <div className="text-xs text-blue-600 font-medium">
                          {getDateFilterLabel()}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-gray-900">{title}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
                  </div>
                  <div className="absolute bottom-3 right-3 flex items-center space-x-2">
                    <Info className="w-4 h-4 text-blue-400" />
                    <Settings className="w-4 h-4 text-gray-400" />
                  </div>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              <p className="text-sm">
                <strong>Total de Tarefas:</strong> Mostra o número total de tarefas criadas no projeto, 
                independente do status atual. Use as configurações para filtrar por período de criação.
              </p>
            </TooltipContent>
          </Tooltip>

          {/* Back of card */}
          <Card className={`w-full backface-hidden rotate-y-180 border border-gray-200 bg-gradient-to-br from-white to-blue-50/30 ${
            isFlipped ? 'relative' : 'absolute'
          }`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Configurar {title}</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClose}
                  className="p-2 h-9 w-9 hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              
              <div className="space-y-6">
                {/* Date Filter Section */}
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <h4 className="text-base font-semibold text-gray-700">Filtro por Data de Criação</h4>
                  </div>
                  <Select 
                    value={dateFilter.type} 
                    onValueChange={(value) => setDateFilter({ type: value as DateFilter['type'] })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione o período" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todo o período</SelectItem>
                      <SelectItem value="last7days">Últimos 7 dias</SelectItem>
                      <SelectItem value="last30days">Últimos 30 dias</SelectItem>
                      <SelectItem value="last90days">Últimos 90 dias</SelectItem>
                      <SelectItem value="thisYear">Este ano</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-2">
                    Filtra tarefas pela data de criação no Jira
                  </p>
                </div>

                {/* Current Filter Info */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h5 className="text-sm font-medium text-blue-900 mb-2">Filtro Atual</h5>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-blue-700">{getDateFilterLabel()}</span>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      {totalTasks} tarefas
                    </Badge>
                  </div>
                </div>

                {/* Info Box */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <Info className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-gray-600 leading-relaxed">
                      <p className="font-medium mb-1">Sobre este cartão:</p>
                      <p>
                        Este cartão mostra o total de tarefas <strong>criadas</strong> no projeto, 
                        não importando o status atual. Por padrão, inclui todas as tarefas já criadas.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <Button
                  size="sm"
                  onClick={handleClose}
                  className="bg-blue-600 text-white hover:bg-blue-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Aplicar Filtro
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </TooltipProvider>
  );
}