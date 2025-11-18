import { Calendar, Stethoscope } from "lucide-react";

interface AppointmentCardProps {
  date: string;
  time: string;
  doctor: string;
  clinic: string;
}

export default function AppointmentCard({
  date,
  time,
  doctor,
  clinic,
}: AppointmentCardProps) {
  return (
    <div className="border-[0.2px] border-[#817D7D] bg-[rgba(240,238,238,0.20)] p-3 lg:p-4 rounded-sm">
      <div className="flex flex-col lg:flex-row items-start justify-between mb-4 gap-3">
        <div className="flex flex-wrap items-center gap-2 lg:gap-3">
          <Calendar className="w-6 h-8 text-black" />
          <span className="text-base lg:text-xl font-bold text-black">{date}</span>
          <div className="w-[51px] h-0 bg-black mx-2"></div>
          <span className="text-base lg:text-xl font-bold text-black">{time}</span>
        </div>
        <button className="px-4 lg:px-6 py-1 rounded-[10px] bg-[#0D9488] shadow-[0_0_6px_0_#000] text-[#FEFEFE] text-sm lg:text-[15px] font-medium hover:bg-[#0BA298] transition-colors whitespace-nowrap">
          Details
        </button>
      </div>
      <div className="flex items-center gap-3 mb-2">
        <img
          src="https://api.builder.io/api/v1/image/assets/TEMP/831679658c5c6808eaa4b2be1e65feb74cc06a1f?width=110"
          alt="Hospital"
          className="w-[55px] h-[31px]"
        />
        <span className="text-sm lg:text-[15px] font-medium text-black">{clinic}</span>
      </div>
      <div className="flex items-center gap-3">
        <Stethoscope className="w-[30px] h-[30px] text-black" />
        <span className="text-sm lg:text-[15px] font-medium text-black">{doctor}</span>
      </div>
    </div>
  );
}