// app/admin/dashboard/page.tsx
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/NextAuthConfig";
import Link from "next/link";
import { CardStats } from "../CardStats";
import { Building2, Users, Link2, Plus, ArrowRight } from "lucide-react";
import { fetchDashboardStats } from "./dashboard-utils";
import { Button } from "@/components/ui/button";

function getCurrentDate(): string {
  return new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

const QuickActionCard = ({
  title,
  description,
  icon: Icon,
  href,
  primary = false,
}: {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  primary?: boolean;
}) => (
  <Link href={href}>
    <div
      className={`relative overflow-hidden rounded-2xl p-6 transition-all hover:shadow-lg hover:-translate-y-1 ${
        primary
          ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white"
          : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-xl ${primary ? "bg-white/20" : "bg-blue-100 dark:bg-blue-900/50"}`}>
            <Icon className={`w-6 h-6 ${primary ? "text-white" : "text-blue-600 dark:text-blue-400"}`} />
          </div>
          <div>
            <h3 className={`font-semibold text-lg ${primary ? "text-white" : "text-gray-900 dark:text-white"}`}>
              {title}
            </h3>
            <p className={`text-sm mt-1 ${primary ? "text-blue-100" : "text-gray-500 dark:text-gray-400"}`}>
              {description}
            </p>
          </div>
        </div>
        <ArrowRight className={`w-5 h-5 ${primary ? "text-blue-200" : "text-gray-400"}`} />
      </div>
    </div>
  </Link>
);

export default async function AdminDashboardPage() {
  try {
    console.log('Fetching session...');
    const session = await getServerSession(authOptions);
    console.log('Session data:', session ? 'Session exists' : 'No session');

    if (!session?.user) {
      console.log('No user in session, redirecting to login');
      redirect("/login");
    }
    
    console.log('User role:', session.user.role);
    if (session.user.role !== "ADMIN") {
      console.log('User is not admin, redirecting to unauthorized');
      redirect("/admin/unauthorized");
    }

    const accessToken = session.accessToken as string;
    console.log('Access token:', accessToken ? 'Token exists' : 'No token');
    
    if (!accessToken) {
      console.error('No access token found in session');
      redirect("/login");
    }

    console.log('Fetching dashboard stats...');
    const stats = await fetchDashboardStats(accessToken);
    console.log('Dashboard stats:', JSON.stringify(stats, null, 2));

    return (
      <div className="space-y-8 p-6 lg:p-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              Gestion des Cliniques & Managers
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 mt-2">{getCurrentDate()}</p>
          
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl px-6 py-4 shadow-sm border">
          <p className="text-sm text-gray-500">Administrateur</p>
          <p className="font-semibold text-gray-900 dark:text-white">
            {session.user.name || "Admin Global"}
          </p>
        </div>
      </div>

      {/* Cartes de stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <CardStats
          title="Cliniques"
          value={stats.clinics.count}
          icon="Building2"
          color="blue"
          description={`${stats.clinics.assigned} assignées • ${stats.clinics.unassigned} non assignées`}
        />
        <CardStats
          title="Managers"
          value={stats.managers.count}
          icon="Users"
          color="emerald"
          description={`${stats.managers.assigned} assignés • ${stats.managers.unassigned} disponibles`}
        />
        <CardStats
          title="Assignations"
          value={stats.assignments.total}
          icon="Link2"
          color="purple"
          description={`${stats.clinics.assigned}/${stats.clinics.count} cliniques couvertes`}
          highlight={stats.clinics.unassigned > 0}
          highlightText={`${stats.clinics.unassigned} sans manager`}
        />
      </div>

      {/* Actions rapides */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <QuickActionCard
            title="Gérer les assignations"
            description="Assigner ou modifier les managers"
            icon={Link2}
            href="/admin/managers"
            primary
          />
        </div>
        <div className="space-y-6">
          <QuickActionCard
            title="Gérer les cliniques"
            description="Créer • Modifier • Supprimer"
            icon={Building2}
            href="/admin/clinics"
          />
          <QuickActionCard
            title="Gérer les managers"
            description="Comptes et permissions"
            icon={Users}
            href="/admin/managers"
          />
        </div>
      </div>

      {/* Cliniques non assignées */}
      {stats.assignments.unassignedClinics.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-xl font-semibold text-amber-900 dark:text-amber-100">
              Cliniques sans manager ({stats.assignments.unassignedClinics.length})
            </h3>
            <Button asChild>
              <Link href="/admin/assignments/create">
                Assigner maintenant <Plus className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.assignments.unassignedClinics.slice(0, 9).map((clinic) => (
              <div
                key={clinic.id}
                className="bg-white dark:bg-gray-800 rounded-xl p-4 border shadow-sm hover:shadow-md transition"
              >
                <p className="font-medium text-gray-900 dark:text-white truncate">{clinic.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {clinic.city} • {new Date(clinic.created_at).toLocaleDateString("fr-FR")}
                </p>
              </div>
            ))}
          </div>

          {stats.assignments.unassignedClinics.length > 9 && (
            <p className="text-center text-sm text-amber-700 dark:text-amber-300 mt-4">
              + {stats.assignments.unassignedClinics.length - 9} autres cliniques
            </p>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-sm text-gray-500 dark:text-gray-400 pt-10">
        {stats.clinics.count} clinique{stats.clinics.count > 1 ? "s" : ""} • {stats.managers.count} manager
        {stats.managers.count > 1 ? "s" : ""}
      </div>
    </div>
  );
  } catch (error) {
    console.error('Error in AdminDashboardPage:', error);
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg max-w-2xl">
          <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">Erreur de chargement</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Une erreur est survenue lors du chargement du tableau de bord. Veuillez rafraîchir la page ou réessayer plus tard.
          </p>
          <Button asChild>
            <Link href="/admin/dashboard">
              Réessayer
            </Link>
          </Button>
        </div>
      </div>
    );
  }
}