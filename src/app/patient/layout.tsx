'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from './components/SideBar';
import {
  Home,
  Users,
  FlaskConical,
  FileText,
  Settings,
  Menu,
  X,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import Navbar from './components/Navbar';

const menuItems = [
  { href: '/patient/dashboard', label: 'Acceuil', icon: Home },
  { href: '/patient/doctors', label: 'Médecins', icon: Users },
  { href: '/patient/analyses', label: 'Analyses', icon: FlaskConical },
  { href: '/patient/factures', label: 'Factures', icon: FileText },
  { href: '/patient/parametres', label: 'Paramétres', icon: Settings },
];

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-white">
      <Sidebar />
     

      {/* === MAIN CONTENT === */}
      <div className="lg:ml-[252px]">
        <Navbar />
        <main className="mt-[66px] p-4 lg:py-8 lg:pr-8 lg:pl-4">
          {children}
        </main>
      </div>
    </div>
  );
}

