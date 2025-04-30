import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

interface Schedule {
  id: string;
  title: string;
  type: string;
  typeBgColor: string;
  typeColor: string;
  datetime: string;
  contactCount: number;
}

export default function UpcomingSchedules() {
  // Query for upcoming schedules
  const { data: schedules, isLoading } = useQuery<Schedule[]>({
    queryKey: ["/api/schedules/upcoming"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/schedules/upcoming");
        if (!res.ok) throw new Error("Failed to fetch upcoming schedules");
        return res.json();
      } catch (error) {
        return [];
      }
    },
  });

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-xl font-semibold">Próximos Agendamentos</h3>
      </div>
      <div className="p-6">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : schedules && schedules.length > 0 ? (
          <ul className="space-y-4">
            {schedules.map((schedule) => (
              <li key={schedule.id} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{schedule.title}</span>
                  <span
                    className={`${schedule.typeBgColor} ${schedule.typeColor} text-xs px-2 py-1 rounded`}
                  >
                    {schedule.type}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{schedule.datetime}</span>
                  <span className="font-medium text-[#4f46e5]">
                    {schedule.contactCount} contatos
                  </span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-6">
            <p className="text-gray-500">Nenhum agendamento próximo</p>
          </div>
        )}
        <div className="mt-4 text-center">
          <Link href="/schedule">
            <a className="text-[#4f46e5] hover:text-[#4f46e5]/80 text-sm font-medium">
              Gerenciar agendamentos
            </a>
          </Link>
        </div>
      </div>
    </div>
  );
}
