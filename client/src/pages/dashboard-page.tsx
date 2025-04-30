import Sidebar from "@/components/layout/sidebar";
import TopNav from "@/components/layout/top-nav";
import StatsCard from "@/components/dashboard/stats-card";
import QuickActions from "@/components/dashboard/quick-actions";
import RecentMessages from "@/components/dashboard/recent-messages";
import UpcomingSchedules from "@/components/dashboard/upcoming-schedules";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardStats {
  totalContacts: number;
  messagesSent: number;
  scheduledMessages: number;
  deliveryRate: number;
}

export default function DashboardPage() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/dashboard/stats");
        if (!res.ok) throw new Error("Failed to fetch dashboard stats");
        return res.json();
      } catch (error) {
        // Return default values if API fails
        return {
          totalContacts: 0,
          messagesSent: 0,
          scheduledMessages: 0,
          deliveryRate: 0,
        };
      }
    },
  });

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopNav />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50">
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6">Dashboard</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {isLoading ? (
                <>
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-40 w-full" />
                  ))}
                </>
              ) : (
                <>
                  <StatsCard
                    title="Total de Contatos"
                    value={stats?.totalContacts || 0}
                    icon="ri-contacts-book-line"
                    iconBgColor="bg-blue-100"
                    iconColor="text-[#4f46e5]"
                    change={{
                      value: "12.5%",
                      isPositive: true,
                      text: "desde o mês passado",
                    }}
                  />
                  <StatsCard
                    title="Mensagens Enviadas"
                    value={stats?.messagesSent || 0}
                    icon="ri-message-2-line"
                    iconBgColor="bg-green-100"
                    iconColor="text-[#10b981]"
                    change={{
                      value: "8.2%",
                      isPositive: true,
                      text: "desde a semana passada",
                    }}
                  />
                  <StatsCard
                    title="Agendamentos"
                    value={stats?.scheduledMessages || 0}
                    icon="ri-calendar-line"
                    iconBgColor="bg-purple-100"
                    iconColor="text-purple-600"
                    change={{
                      value: "12 mensagens",
                      isPositive: true,
                      text: "para hoje",
                    }}
                  />
                  <StatsCard
                    title="Taxa de Entrega"
                    value={`${stats?.deliveryRate || 0}%`}
                    icon="ri-check-double-line"
                    iconBgColor="bg-yellow-100"
                    iconColor="text-yellow-600"
                    change={{
                      value: "0.3%",
                      isPositive: false,
                      text: "desde ontem",
                    }}
                  />
                </>
              )}
            </div>
          </div>

          <QuickActions />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <RecentMessages />
            <UpcomingSchedules />
          </div>
        </main>
      </div>
    </div>
  );
}
