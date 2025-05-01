import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Calendar as CalendarIcon, Clock, Send, Info, AlertTriangle } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

interface ScheduleMessageFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSchedule: (scheduleData: ScheduleData) => void;
  contactsCount: number;
  messageContent: string;
}

export interface ScheduleData {
  date: Date;
  time: string;
  sendOption: "once" | "daily" | "weekly";
  weekDay?: string;
}

export default function ScheduleMessageForm({ 
  isOpen, 
  onClose, 
  onSchedule,
  contactsCount,
  messageContent
}: ScheduleMessageFormProps) {
  const { toast } = useToast();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [time, setTime] = useState("12:00");
  const [sendOption, setSendOption] = useState<"once" | "daily" | "weekly">("once");
  const [weekDay, setWeekDay] = useState<string | undefined>(undefined);
  
  // Definir horários disponíveis
  const timeSlots = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      timeSlots.push(
        `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`
      );
    }
  }

  const weekDays = [
    { value: "sunday", label: "Domingo" },
    { value: "monday", label: "Segunda-feira" },
    { value: "tuesday", label: "Terça-feira" },
    { value: "wednesday", label: "Quarta-feira" },
    { value: "thursday", label: "Quinta-feira" },
    { value: "friday", label: "Sexta-feira" },
    { value: "saturday", label: "Sábado" },
  ];

  const handleSchedule = () => {
    if (!date) {
      toast({
        title: "Data necessária",
        description: "Por favor, selecione uma data para o agendamento",
        variant: "destructive",
      });
      return;
    }

    // Verificar se precisa de um dia da semana para opção semanal
    if (sendOption === "weekly" && !weekDay) {
      toast({
        title: "Dia da semana necessário",
        description: "Por favor, selecione um dia da semana para envios semanais",
        variant: "destructive",
      });
      return;
    }
    
    const scheduleData: ScheduleData = {
      date,
      time,
      sendOption,
      weekDay: sendOption === "weekly" ? weekDay : undefined
    };
    
    onSchedule(scheduleData);
    
    toast({
      title: "Mensagem agendada",
      description: `Sua mensagem foi agendada com sucesso para ${format(date, "dd/MM/yyyy")} às ${time}`,
    });
    
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Agendar Envio de Mensagem</DialogTitle>
          <DialogDescription>
            Configure quando sua mensagem será enviada para os destinatários.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2 mb-2 bg-orange-50 p-2 rounded-md border border-orange-200">
              <Info className="h-5 w-5 text-orange-500 flex-shrink-0" />
              <p className="text-sm text-orange-800">
                Esta mensagem será enviada para <strong>{contactsCount}</strong> destinatário{contactsCount !== 1 ? 's' : ''}.
              </p>
            </div>
          
            <div className="p-3 border rounded-md bg-gray-50 max-h-32 overflow-y-auto">
              <p className="text-sm text-gray-600 whitespace-pre-line">{messageContent}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data de envio</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP", { locale: pt }) : "Selecione a data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <Label>Horário</Label>
              <Select value={time} onValueChange={setTime}>
                <SelectTrigger className="w-full">
                  <SelectValue>
                    <div className="flex items-center">
                      <Clock className="mr-2 h-4 w-4" />
                      {time}
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {timeSlots.map((slot) => (
                    <SelectItem key={slot} value={slot}>
                      {slot}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Frequência de envio</Label>
            <Select value={sendOption} onValueChange={(value: "once" | "daily" | "weekly") => {
              setSendOption(value);
              // Resetar dia da semana se não for semanal
              if (value !== "weekly") {
                setWeekDay(undefined);
              }
            }}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione a frequência" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="once">Uma vez apenas</SelectItem>
                <SelectItem value="daily">Diariamente</SelectItem>
                <SelectItem value="weekly">Semanalmente</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {sendOption === "weekly" && (
            <div className="space-y-2">
              <Label>Dia da semana</Label>
              <Select value={weekDay} onValueChange={setWeekDay}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione o dia da semana" />
                </SelectTrigger>
                <SelectContent>
                  {weekDays.map((day) => (
                    <SelectItem key={day.value} value={day.value}>
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          {(sendOption === "daily" || sendOption === "weekly") && (
            <div className="flex items-center gap-2 p-2 rounded-md bg-yellow-50 border border-yellow-200">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <p className="text-sm text-yellow-800">
                {sendOption === "daily" 
                  ? "Esta mensagem será enviada diariamente a partir da data selecionada."
                  : "Esta mensagem será enviada semanalmente no dia selecionado."}
              </p>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSchedule}
            className="bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600"
          >
            <Send className="mr-2 h-4 w-4" />
            Agendar Mensagem
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}