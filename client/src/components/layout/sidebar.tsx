import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";

export default function Sidebar() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const navItems = [
    { path: "/", label: "Dashboard", icon: "ri-dashboard-line" },
    { path: "/contacts", label: "Contatos", icon: "ri-contacts-book-line" },
    { path: "/messages", label: "Mensagens", icon: "ri-message-2-line" },
    { path: "/schedule", label: "Agendamentos", icon: "ri-calendar-line" },
    { path: "/whatsapp-setup", label: "Conexão WhatsApp", icon: "ri-whatsapp-line" },
    { path: "/whatsapp-groups-contacts", label: "Grupos & Contatos", icon: "ri-group-line" },
    { path: "/reports", label: "Relatórios", icon: "ri-bar-chart-line" },
    { path: "/settings", label: "Configurações", icon: "ri-settings-line" },
  ];

  if (!user) return null;

  const userInitials = user.username.substring(0, 2).toUpperCase();

  return (
    <div className="w-64 bg-gray-900 text-white hidden md:flex flex-col flex-shrink-0 h-screen">
      <div className="p-4 flex items-center border-b border-gray-800">
        <i className="ri-chat-3-line text-[#f97316] text-2xl mr-2"></i>
        <h1 className="text-xl font-semibold">WhatsApp Sender</h1>
      </div>
      <nav className="p-4 flex-grow">
        <ul>
          {navItems.map((item) => (
            <li key={item.path}>
              <Link href={item.path}>
                <a
                  className={`flex items-center p-3 rounded-lg mb-1 ${
                    location === item.path
                      ? "bg-orange-600 text-white"
                      : "hover:bg-gray-800 hover:text-orange-400 transition-colors"
                  }`}
                >
                  <i className={`${item.icon} mr-3`}></i>
                  <span>{item.label}</span>
                </a>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center mr-3">
            <span className="text-sm font-bold">{userInitials}</span>
          </div>
          <div>
            <p className="font-medium">{user.username}</p>
            <p className="text-xs text-gray-400">{user.email || "Usuário"}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          disabled={logoutMutation.isPending}
          className="w-full flex items-center justify-center py-2 px-3 rounded bg-gray-800 hover:bg-gray-700 transition-colors"
        >
          <i className="ri-logout-box-line mr-2"></i>
          <span>Sair</span>
        </button>
      </div>
    </div>
  );
}
