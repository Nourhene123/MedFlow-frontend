'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, UserPlus, Filter, Mail, Phone, Shield, Calendar } from 'lucide-react';

const users = [
  { id: 1, name: "Dr. Ahmed Benali", role: "Médecin", email: "ahmed@clinique1.com", phone: "+213 555 123 456", clinic: "Clinique Nord", joined: "2024-01-15" },
  { id: 2, name: "Sarah Dupont", role: "Réceptionniste", email: "sarah@clinique1.com", phone: "+33 6 12 34 56 78", clinic: "Clinique Nord", joined: "2024-03-20" },
  { id: 3, name: "Patient 101", role: "Patient", email: "p101@gmail.com", phone: "", clinic: "Clinique Sud", joined: "2025-02-10" },
];

export default function UsersPage() {
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  const filtered = users.filter(u =>
    (u.name.toLowerCase().includes(search.toLowerCase()) || u.email.includes(search)) &&
    (filterRole === 'all' || u.role === filterRole)
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Utilisateurs</h1>
        <button className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-xl flex items-center gap-2">
          <UserPlus className="w-5 h-5" />
          Ajouter un utilisateur
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Rechercher un utilisateur..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl border bg-white dark:bg-gray-800"
          />
        </div>
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="px-4 py-3 rounded-xl border bg-white dark:bg-gray-800"
        >
          <option value="all">Tous les rôles</option>
          <option value="Médecin">Médecin</option>
          <option value="Réceptionniste">Réceptionniste</option>
          <option value="Patient">Patient</option>
        </select>
      </div>

      <div className="grid gap-4">
        {filtered.map((user) => (
          <motion.div
            key={user.id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 flex items-center justify-between hover:shadow-xl transition"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                {user.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <h3 className="font-semibold text-lg">{user.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                  <Shield className="w-4 h-4" /> {user.role} • {user.clinic}
                </p>
              </div>
            </div>
            <div className="text-right text-sm text-gray-600 dark:text-gray-400">
              <p className="flex items-center justify-end gap-1"><Mail className="w-4 h-4" /> {user.email}</p>
              {user.phone && <p className="flex items-center justify-end gap-1"><Phone className="w-4 h-4" /> {user.phone}</p>}
              <p className="flex items-center justify-end gap-1"><Calendar className="w-4 h-4" /> {new Date(user.joined).toLocaleDateString()}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}