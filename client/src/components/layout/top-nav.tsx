import MobileMenu from "./mobile-menu";
import { Link } from "wouter";

export default function TopNav() {
  return (
    <header className="bg-white border-b border-gray-200 flex items-center justify-between p-4 md:py-2">
      <div className="flex items-center md:hidden">
        <MobileMenu />
        <h1 className="text-xl font-semibold ml-2 bg-gradient-to-r from-blue-500 to-orange-500 bg-clip-text text-transparent">Automizap</h1>
      </div>
      <div className="flex items-center ml-auto">
        <div className="relative mr-3">
          <input
            type="text"
            placeholder="Pesquisar..."
            className="py-2 pl-10 pr-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent w-full md:w-64"
          />
          <i className="ri-search-line absolute left-3 top-2.5 text-gray-500"></i>
        </div>
        <div className="flex">
          <button className="p-2 rounded-full text-gray-700 hover:bg-gray-100 relative">
            <i className="ri-notification-3-line text-xl"></i>
            <span className="absolute top-1 right-1 w-4 h-4 bg-[#4f46e5] rounded-full text-white text-xs flex items-center justify-center">
              3
            </span>
          </button>
          <Link href="/profile">
            <a className="p-2 rounded-full text-gray-700 hover:bg-gray-100 md:hidden">
              <i className="ri-user-line text-xl"></i>
            </a>
          </Link>
        </div>
      </div>
    </header>
  );
}
