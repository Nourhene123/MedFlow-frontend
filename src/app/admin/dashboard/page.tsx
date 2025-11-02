
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/NextAuthConfig";
import Link from "next/link";
import { CardStats } from "../CardStats";

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/admin/unauthorized");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Bienvenue, {session.user.name || "Admin Global"}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Gérez votre réseau de cliniques et suivez les performances.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <CardStats title="Cliniques" value="12" icon="building" color="blue" trend="+2" />
        <CardStats title="Managers" value="15" icon="users" color="green" trend="+3" />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/admin/clinics" className="block">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white hover:shadow-xl transition">
            <h2 className="text-xl font-bold mb-2">Créer une Clinique</h2>
            <p className="text-blue-100 mb-4">Ajoutez une nouvelle clinique et attribuez un manager.</p>
            <span className="inline-block bg-white text-blue-600 px-5 py-2 rounded-lg font-medium">
              Gérer les cliniques
            </span>
          </div>
        </Link>

       
      </div>
    </div>
  );
}