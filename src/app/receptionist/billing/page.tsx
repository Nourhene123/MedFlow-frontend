'use client';

import useSWR from 'swr';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { FileText, DollarSign, Calendar, ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000/api/';

export default function InvoicesPage() {
  const { id } = useParams();
  const { data: session } = useSession();

  const fetcher = (url: string) =>
    fetch(url, {
      headers: {
        Authorization: `Bearer ${session?.accessToken}`,
      },
    }).then(res => res.json());

  const { data: invoices = [], isLoading } = useSWR(
    `${API_BASE}invoices/patient/${id}/`,
    fetcher
  );

  const { data: patient } = useSWR(
    `${API_BASE}accounts/patients/${id}/`,
    fetcher
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/receptionist/patients">
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Factures
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {patient ? `${patient.firstname} ${patient.lastname}` : 'Chargement...'}
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
        {isLoading ? (
          <p className="text-center text-gray-500">Chargement des factures...</p>
        ) : invoices.length === 0 ? (
          <p className="text-center text-gray-500">Aucune facture</p>
        ) : (
          <div className="space-y-4">
            {invoices.map((inv: any) => (
              <div key={inv.id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      Facture #{inv.numero}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {format(new Date(inv.date_emission), 'dd MMM yyyy')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-green-600">
                    {inv.montant_total} FCFA
                  </p>
                  <p className="text-sm flex items-center gap-1">
                    {inv.payee ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        Payée
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-red-600" />
                        Impayée
                      </>
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}