import React from 'react';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-gradient-to-r from-blue-800/90 to-orange-600/90 text-white py-4 px-6 shadow-lg">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <h3 className="text-xl font-bold flex items-center">
              <span className="bg-white text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-orange-500">
                AutomizAI
              </span>
              <span className="ml-2 text-white text-opacity-90">Plataforma de Automação WhatsApp</span>
            </h3>
          </div>
          
          <div className="text-center md:text-right">
            <p className="text-xs md:text-sm text-white/80 mb-1">
              © {currentYear} Desenvolvido por <span className="font-semibold">AutomizAI - Rodrigo Pasa</span>
            </p>
            <div className="flex justify-center md:justify-end space-x-4 mt-2">
              <a 
                href="#" 
                className="text-white hover:text-orange-200 transition-colors"
                aria-label="Site oficial"
              >
                <i className="ri-global-line text-lg"></i>
              </a>
              <a 
                href="#" 
                className="text-white hover:text-orange-200 transition-colors"
                aria-label="LinkedIn"
              >
                <i className="ri-linkedin-fill text-lg"></i>
              </a>
              <a 
                href="#" 
                className="text-white hover:text-orange-200 transition-colors"
                aria-label="GitHub"
              >
                <i className="ri-github-fill text-lg"></i>
              </a>
              <a 
                href="#" 
                className="text-white hover:text-orange-200 transition-colors"
                aria-label="Contato por WhatsApp"
              >
                <i className="ri-whatsapp-line text-lg"></i>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}