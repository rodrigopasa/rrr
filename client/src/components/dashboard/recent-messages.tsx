import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

interface Message {
  id: string;
  title: string;
  description: string;
  icon: string;
  iconBgColor: string;
  iconColor: string;
  time: string;
}

export default function RecentMessages() {
  // Query for recent messages
  const { data: messages, isLoading } = useQuery<Message[]>({
    queryKey: ["/api/messages/recent"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/messages/recent");
        if (!res.ok) throw new Error("Failed to fetch recent messages");
        return res.json();
      } catch (error) {
        return [];
      }
    },
  });

  return (
    <div className="bg-white rounded-lg shadow lg:col-span-2">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-xl font-semibold">Mensagens Recentes</h3>
      </div>
      <div className="p-6">
        {isLoading ? (
          <div className="space-y-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-start">
                <Skeleton className="h-10 w-10 rounded-full mr-4" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                </div>
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
        ) : messages && messages.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {messages.map((message) => (
              <li key={message.id} className="py-4 first:pt-0 last:pb-0">
                <div className="flex items-start">
                  <div className="mr-4">
                    <div
                      className={`w-10 h-10 rounded-full ${message.iconBgColor} flex items-center justify-center`}
                    >
                      <i className={`${message.icon} ${message.iconColor}`}></i>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {message.title}
                    </p>
                    <p className="text-sm text-gray-500 truncate mt-1">
                      {message.description}
                    </p>
                  </div>
                  <div className="text-sm text-gray-500">
                    <span>{message.time}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-6">
            <p className="text-gray-500">Nenhuma mensagem recente</p>
          </div>
        )}
        <div className="mt-4 text-center">
          <Link href="/messages">
            <a className="text-[#4f46e5] hover:text-[#4f46e5]/80 text-sm font-medium">
              Ver todas as mensagens
            </a>
          </Link>
        </div>
      </div>
    </div>
  );
}
