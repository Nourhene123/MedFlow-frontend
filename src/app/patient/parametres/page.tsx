'use client';

import { useSession } from "next-auth/react";

export default function ParametresPage() {
  const { data: session } = useSession();
  const userInitial = session?.user?.firstname?.[0] || session?.user?.name?.[0] || 'A';
  const userName = session?.user?.firstname && session?.user?.lastname 
    ? `${session.user.firstname} ${session.user.lastname}`
    : session?.user?.name || 'Ahmed Jellasi';
  const userEmail = session?.user?.email || 'ahmed@gmail.com';

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Paramètres</h1>
        <p className="text-gray-600 mt-2">Gérez vos paramètres de compte</p>
      </div>

      <section className="border-[0.5px] border-[#AFA9A9] rounded-[15px] shadow-[0_0_6px_0_#68BA7F] p-6">
        <div className="flex justify-center mb-6">
          <div className="inline-flex px-6 py-2 justify-center items-center rounded-[15px] bg-gradient-to-r from-[#0D9488] via-[#0D9488] to-[#00746E] shadow-[0_6px_10px_0_#68BA7F]">
            <h2 className="text-white text-xl font-bold">Mes Information</h2>
          </div>
        </div>

        <div className="flex flex-col items-center mb-6">
          <div className="w-[108px] h-[100px] rounded-full bg-gradient-to-br from-teal-primary to-teal-dark flex items-center justify-center mb-2">
            <span className="text-white text-5xl font-bold">{userInitial.toUpperCase()}</span>
          </div>
          <h3 className="text-xl font-bold text-black">{userName}</h3>
        </div>

        <div className="border border-[#CDC8C8] bg-[#FEFBFB] divide-y divide-[#E5DFDF]">
          <div className="flex items-center py-3 px-4">
            <span className="text-xl font-medium text-black w-32">Nom</span>
            <span className="text-xl font-medium text-black ml-auto">{userName}</span>
          </div>
          <div className="flex items-center py-3 px-4">
            <span className="text-xl font-medium text-black w-32">Email</span>
            <span className="text-[15px] font-medium text-black ml-auto">
              {userEmail}
            </span>
          </div>
          <div className="flex items-center py-3 px-4">
            <span className="text-xl font-medium text-black w-32">Phone</span>
            <span className="text-xl font-medium text-black ml-auto">
              50 888 999
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}

