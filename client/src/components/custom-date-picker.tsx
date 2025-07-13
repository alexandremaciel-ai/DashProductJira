import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CustomDatePickerProps {
  startDate?: string;
  endDate?: string;
  onDateChange: (startDate?: string, endDate?: string) => void;
  onClear: () => void;
}

export function CustomDatePicker({ startDate, endDate, onDateChange, onClear }: CustomDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempStartDate, setTempStartDate] = useState<Date | undefined>(
    startDate ? new Date(startDate) : undefined
  );
  const [tempEndDate, setTempEndDate] = useState<Date | undefined>(
    endDate ? new Date(endDate) : undefined
  );

  const handleApply = () => {
    const start = tempStartDate?.toISOString().split('T')[0];
    const end = tempEndDate?.toISOString().split('T')[0];
    onDateChange(start, end);
    setIsOpen(false);
  };

  const handleClear = () => {
    setTempStartDate(undefined);
    setTempEndDate(undefined);
    onClear();
    setIsOpen(false);
  };

  const formatDateRange = () => {
    if (!startDate && !endDate) return "Selecionar período";
    if (startDate && !endDate) {
      return `A partir de ${format(new Date(startDate), "dd/MM/yyyy", { locale: ptBR })}`;
    }
    if (!startDate && endDate) {
      return `Até ${format(new Date(endDate), "dd/MM/yyyy", { locale: ptBR })}`;
    }
    if (startDate && endDate) {
      return `${format(new Date(startDate), "dd/MM/yyyy", { locale: ptBR })} - ${format(new Date(endDate), "dd/MM/yyyy", { locale: ptBR })}`;
    }
    return "Selecionar período";
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between text-left font-normal"
        >
          <span className="truncate">{formatDateRange()}</span>
          <CalendarIcon className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Selecionar Período Personalizado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-600">Data de Início</label>
              <Calendar
                mode="single"
                selected={tempStartDate}
                onSelect={setTempStartDate}
                locale={ptBR}
                className="rounded-md border"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-600">Data de Fim</label>
              <Calendar
                mode="single"
                selected={tempEndDate}
                onSelect={setTempEndDate}
                locale={ptBR}
                className="rounded-md border"
                disabled={(date) => tempStartDate ? date < tempStartDate : false}
              />
            </div>

            <div className="flex space-x-2 pt-2">
              <Button
                size="sm"
                onClick={handleApply}
                className="flex-1 bg-blue-600 text-white hover:bg-blue-700"
              >
                Aplicar
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleClear}
                className="flex-1"
              >
                <X className="h-3 w-3 mr-1" />
                Limpar
              </Button>
            </div>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
}