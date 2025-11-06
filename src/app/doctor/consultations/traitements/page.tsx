/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from "react";
import useSWR from "swr";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { useSession } from "next-auth/react";

export default function TraitementsPage() {
  const { data: session } = useSession();
  const { data: traitements = [], isLoading, mutate } = useSWR("/medical/traitements/list/");

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: "", description: "", cost: 0 });

  const submitTraitement = async () => {
    const url = editing ? `/api/medical/traitements/${editing.id}/update/` : `/api/medical/traitements/create/`;
    const method = editing ? "PATCH" : "POST";
    await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${session?.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });
    setShowForm(false);
    setEditing(null);
    mutate("/medical/traitements/list/");
  };

  const deleteTraitement = async (id: number) => {
    if (!confirm("Supprimer ce traitement ?")) return;
    await fetch(`/api/medical/traitements/${id}/delete/`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${session?.accessToken}` },
    });
    mutate("/medical/traitements/list/");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Traitements</h1>
          <p className="text-gray-600 dark:text-gray-400">Gérez les soins disponibles.</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditing(null); setForm({ name: "", description: "", cost: 0 }); }}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-xl hover:bg-teal-700"
        >
          <Plus className="w-5 h-5" />
          Ajouter
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <p>Chargement...</p>
        ) : traitements.map((t: any) => (
          <div key={t.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-semibold text-lg">{t.name}</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => { setEditing(t); setForm(t); setShowForm(true); }}
                  className="text-blue-600 hover:text-blue-700"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteTraitement(t.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{t.description || "Aucune description"}</p>
            <p className="text-lg font-bold text-teal-600">€{t.cost}</p>
          </div>
        ))}
      </div>

      {/* Modal formulaire */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">{editing ? "Modifier" : "Nouveau"} traitement</h2>
            <input
              type="text"
              placeholder="Nom"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full p-3 border rounded-xl mb-3"
            />
            <textarea
              placeholder="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full p-3 border rounded-xl mb-3 h-24"
            />
            <input
              type="number"
              placeholder="Coût (€)"
              value={form.cost}
              onChange={(e) => setForm({ ...form, cost: parseFloat(e.target.value) || 0 })}
              className="w-full p-3 border rounded-xl mb-4"
            />
            <div className="flex gap-3">
              <button onClick={submitTraitement} className="flex-1 bg-teal-600 text-white py-2 rounded-xl">
                {editing ? "Mettre à jour" : "Créer"}
              </button>
              <button onClick={() => setShowForm(false)} className="flex-1 bg-gray-200 dark:bg-gray-700 py-2 rounded-xl">
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}