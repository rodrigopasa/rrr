import MainLayout from "@/components/layout/main-layout";
import StatsCard from "@/components/dashboard/stats-card";
import QuickActions from "@/components/dashboard/quick-actions";
import RecentMessages from "@/components/dashboard/recent-messages";
import UpcomingSchedules from "@/components/dashboard/upcoming-schedules";
import WhatsAppStatus from "@/components/dashboard/whatsapp-status";
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
    <MainLayout>
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
                iconBgColor="bg-gradient-to-r from-blue-100 to-blue-200"
                iconColor="text-blue-600"
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
                iconBgColor="bg-gradient-to-r from-green-100 to-green-200"
                iconColor="text-green-600"
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
                iconBgColor="bg-gradient-to-r from-orange-100 to-orange-200"
                iconColor="text-orange-600"
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
                iconBgColor="bg-gradient-to-r from-blue-100 to-orange-100"
                iconColor="text-blue-600"
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <QuickActions />
        <WhatsAppStatus />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <RecentMessages />
        <UpcomingSchedules />
      </div>
    </MainLayout>
  );
}
