import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { useState } from "react";

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleLogout = () => {
    logoutMutation.mutate();
    setIsOpen(false);
  };

  const navItems = [
    { path: "/", label: "Dashboard", icon: "ri-dashboard-line" },
    { path: "/contacts", label: "Contatos", icon: "ri-contacts-book-line" },
    { path: "/messages", label: "Mensagens", icon: "ri-message-2-line" },
    { path: "/schedule", label: "Agendamentos", icon: "ri-calendar-line" },
    { path: "/reports", label: "Relatórios", icon: "ri-bar-chart-line" },
    { path: "/settings", label: "Configurações", icon: "ri-settings-line" },
  ];

  if (!user) return null;

  const userInitials = user.username.substring(0, 2).toUpperCase();

  return (
    <>
      <button 
        className="p-2 rounded-md text-gray-700 hover:bg-gray-100 md:hidden"
        onClick={handleToggle}
      >
        <i className="ri-menu-line text-xl"></i>
      </button>
      
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={handleClose}
        >
          <div className="bg-gray-900 text-white h-full w-64 absolute left-0 top-0" onClick={e => e.stopPropagation()}>
            <div className="p-4 flex items-center justify-between border-b border-gray-800">
              <div className="flex items-center">
                <i className="ri-whatsapp-line text-[#25D366] text-2xl mr-2"></i>
                <h1 className="text-xl font-semibold bg-gradient-to-r from-blue-500 to-orange-500 bg-clip-text text-transparent">Automizap</h1>
              </div>
              <button className="text-white" onClick={handleClose}>
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>
            <nav className="p-4">
              <ul>
                {navItems.map((item) => (
                  <li key={item.path}>
                    <Link href={item.path}>
                      <a
                        className={`flex items-center p-3 rounded-lg mb-1 ${
                          location === item.path
                            ? "bg-gray-800 text-white"
                            : "hover:bg-gray-800 transition-colors"
                        }`}
                        onClick={handleClose}
                      >
                        <i className={`${item.icon} mr-3`}></i>
                        <span>{item.label}</span>
                      </a>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="absolute bottom-0 w-64 p-4 border-t border-gray-800">
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
        </div>
      )}
    </>
  );
}
