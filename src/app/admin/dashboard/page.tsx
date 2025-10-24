// src/app/admin/dashboard/page.tsx
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/NextAuthConfig";

export default async function AdminDashboardPage() {
  // Get the current session (server-side)
  const session = await getServerSession(authOptions);

  // If no session, redirect to login
  if (!session) {
    redirect("/login");
  }

  // If user is not an ADMIN, redirect to unauthorized
  if (session.user.role !== "ADMIN") {
    redirect("/unauthorized");
  }

  // Display Admin Dashboard content
  return (
    <main className="min-h-screen bg-gray-50 p-10">
      <div className="max-w-5xl mx-auto bg-white shadow-lg rounded-2xl p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          🧭 Admin Dashboard
        </h1>

        <div className="space-y-3 text-gray-700">
          <p>
            Welcome, <span className="font-semibold">{session.user.email}</span>!
          </p>
          <p>Role: <span className="font-semibold text-blue-600">{session.user.role}</span></p>
          <p>
            This is your administrative dashboard. From here, you can manage
            users, doctors, and clinic data.
          </p>
        </div>

        <div className="mt-8">
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-blue-700 mb-2">
                👨‍⚕️ Manage Doctors
              </h2>
              <p className="text-sm text-gray-600">
                Add, update, or remove medical staff records.
              </p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-green-700 mb-2">
                🧾 Manage Patients
              </h2>
              <p className="text-sm text-gray-600">
                View and manage patient accounts and medical sheets.
              </p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-yellow-700 mb-2">
                🏥 Clinic Overview
              </h2>
              <p className="text-sm text-gray-600">
                Monitor clinic statistics, performance, and staff activity.
              </p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-red-700 mb-2">
                ⚙️ Settings
              </h2>
              <p className="text-sm text-gray-600">
                Configure system preferences and manage admin privileges.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
