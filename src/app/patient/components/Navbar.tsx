'use client';

import { Search, Facebook, Instagram, Twitter, MapPin, Bell } from "lucide-react";
import { useSession } from "next-auth/react";

export default function Navbar() {
  const { data: session } = useSession();
  const userInitial = session?.user?.firstname?.[0] || session?.user?.name?.[0] || 'P';

  return (
    <nav className="fixed top-0 left-0 lg:left-[252px] right-0 h-[66px] bg-white border-b-[0.3px] border-black shadow-[0_4px_10px_0_rgba(0,0,0,1)] z-40 flex items-center px-4 lg:px-8">
      <div className="hidden md:flex items-center gap-4 lg:gap-6">
        <a href="#" className="text-black hover:text-gray-600 transition-colors">
          <Facebook className="w-4 lg:w-5 h-4 lg:h-5" />
        </a>
        <a href="#" className="text-black hover:text-gray-600 transition-colors">
          <Instagram className="w-4 lg:w-5 h-4 lg:h-5" />
        </a>
        <a href="#" className="text-black hover:text-gray-600 transition-colors">
          <Twitter className="w-4 lg:w-5 h-4 lg:h-5" />
        </a>
        <a href="#" className="text-black hover:text-gray-600 transition-colors">
          <MapPin className="w-4 lg:w-5 h-4 lg:h-5" />
        </a>
      </div>

      <div className="flex-1 flex justify-center px-4 lg:px-12 ml-12 lg:ml-0">
        <div className="relative w-full max-w-[319px]">
          <input
            type="text"
            placeholder="Search by doctor, ..."
            className="w-full h-10 lg:h-12 px-10 lg:px-12 rounded-[20px] bg-[#ECE7E7]/46 text-xs lg:text-sm placeholder:text-[#B0AAAA] placeholder:font-bold focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
          />
          <Search className="absolute left-3 lg:left-4 top-1/2 -translate-y-1/2 w-4 lg:w-5 h-4 lg:h-5 text-[#ADA8A8]" />
        </div>
      </div>

      <div className="flex items-center gap-3 lg:gap-6">
        <button className="relative">
          <Bell className="w-5 lg:w-6 h-5 lg:h-6 text-black" />
        </button>
        <div className="w-10 h-10 lg:w-[51px] lg:h-[42px] rounded-full bg-[#0D9488] flex items-center justify-center">
          <span className="text-white text-2xl lg:text-[35px] font-extrabold">{userInitial.toUpperCase()}</span>
        </div>
      </div>
    </nav>
  );
}
