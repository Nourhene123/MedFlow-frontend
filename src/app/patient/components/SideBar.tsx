'use client';

import { Home, Users, FlaskConical, FileText, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface SidebarProps {
  activeItem?: string;
}

export default function Sidebar({ activeItem }: SidebarProps) {
  const pathname = usePathname();
  const menuItems = [
    { name: "Acceuil", href: "/patient/dashboard", icon: Home },
    { name: "Médecins", href: "/patient/doctors", icon: Users },
    { name: "Analyses", href: "/patient/analyses", icon: FlaskConical },
    { name: "Factures", href: "/patient/factures", icon: FileText },
    { name: "Paramétres", href: "/patient/parametres", icon: Settings },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-[252px] bg-white shadow-[4px_0_10px_3px_rgba(184,177,177,0.25)] z-50">
      <div className="h-[101px] border-b border-[#DCE5DF] shadow-[0_2px_10px_0_#CFFFDC] flex items-center px-4">
        <div className="w-[51px] h-[44px] rounded-[10px] bg-gradient-to-b from-[#079188] to-[#067069] flex items-center justify-center">
          <span className="text-[35px] font-bold text-[#F9FEFB] font-istok drop-shadow-[0_4px_4px_rgba(0,0,0,0.25)]">
            M
          </span>
        </div>
        <h1 className="ml-5 text-[27px] font-bold text-[#070606] font-istok drop-shadow-[0_0_5px_rgba(38,34,34,0.50)]">
          MediSaas
        </h1>
      </div>

      <nav className="mt-[54px] px-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`) || (activeItem && item.name === activeItem);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "w-full h-8 flex items-center px-[63px] mb-[33px] rounded-[15px] transition-all relative",
                isActive
                  ? "bg-gradient-to-r from-[#0BA298] to-[#017973]"
                  : "bg-white hover:bg-gray-50"
              )}
            >
              <Icon
                className={cn(
                  "absolute left-[19px] w-6 h-6",
                  isActive ? "stroke-white stroke-[3]" : "stroke-[#181616] stroke-[3]"
                )}
              />
              <span
                className={cn(
                  "text-[25px] font-semibold font-roboto-condensed",
                  isActive ? "text-[#FFF8F8]" : "text-[#8B8181]"
                )}
              >
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
