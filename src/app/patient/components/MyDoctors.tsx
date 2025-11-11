import Image from "next/image";
import { NotebookPen, Calendar, Plus, MessageCircleDashed } from "lucide-react";
import { cn } from "@/lib/utils";

interface DoctorDetailCardProps {
  name: string;
  specialty: string;
  clinic: string;
  consultationFee: string;
  yearsOfExperience: number;
  image?: string;
  className?: string;
  onNotesClick?: () => void;
  onAvailabilityClick?: () => void;
  onBookClick?: () => void;
  onMessageClick?: () => void;
}

export default function DoctorDetailCard({
  name,
  specialty,
  clinic,
  consultationFee,
  yearsOfExperience,
  image,
  className,
  onNotesClick,
  onAvailabilityClick,
  onBookClick,
  onMessageClick,
}: DoctorDetailCardProps) {
  return (
    <div
      className={cn(
        "w-full rounded-[20px] border border-[#CAC5C5] bg-[rgba(253,251,251,0.29)] p-5 lg:p-6",
        className
      )}
    >
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
        {/* Left section - Avatar and basic info */}
        <div className="flex gap-4 flex-shrink-0">
          <div className="relative w-[70px] h-16 rounded-full bg-gray-300 flex-shrink-0 overflow-hidden">
            {image ? (
              <Image src={image} alt={name} fill className="object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-teal-primary to-teal-dark flex items-center justify-center text-white text-2xl font-bold">
                {name.trim().charAt(0).toUpperCase() || "M"}
              </div>
            )}
          </div>
          
          <div className="flex flex-col justify-center min-w-0">
            <h3 className="text-xl lg:text-2xl font-bold text-[#787777] mb-0.5 truncate">
              {name}
            </h3>
            <p className="text-sm font-medium text-[#8D8787]">{specialty}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-[#8B8181]">Speciality</span>
            </div>
            <p className="text-sm font-medium text-[#8B8181] mt-1">
              Clinic: {clinic}
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="hidden lg:block w-px h-auto bg-[#8B8181] self-stretch my-2"></div>

        {/* Middle section - Fee and Experience */}
        <div className="flex flex-col justify-center gap-2 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-[#8B8181]">
              Consultation Fee:
            </span>
            <span className="text-sm font-medium text-[#8B8181]">
              {consultationFee}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-[#8B8181]">
              Years of Experience:
            </span>
            <span className="text-sm font-medium text-[#A29C9C]">
              {yearsOfExperience}
            </span>
          </div>
        </div>

        {/* Right section - Action buttons */}
        <div className="flex flex-wrap gap-2 lg:ml-auto items-center">
          <button
            onClick={onNotesClick}
            className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-[20px] border border-[#E0DCDC] bg-[#68BA7F] shadow-[0_4px_4px_0_rgba(0,0,0,0.25)] text-[#FFFAFA] text-sm font-medium hover:bg-[#5AA970] transition-colors"
          >
            <NotebookPen className="w-3 h-4 stroke-[#FDFBFB]" strokeWidth={1.2} />
            Notes
          </button>

          <button
            onClick={onAvailabilityClick}
            className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-[20px] border border-[#E0DCDC] bg-[#68BA7F] shadow-[0_4px_4px_0_rgba(0,0,0,0.25)] text-[#FFFAFA] text-sm font-medium hover:bg-[#5AA970] transition-colors whitespace-nowrap"
          >
            <Calendar className="w-3 h-4 stroke-[#FFFEFE]" strokeWidth={1.333} />
            Availability
          </button>

          <button
            onClick={onBookClick}
            className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-[20px] border border-[#E0DCDC] bg-[#68BA7F] shadow-[0_4px_4px_0_rgba(0,0,0,0.25)] text-[#FFFAFA] text-sm font-medium hover:bg-[#5AA970] transition-colors"
          >
            <Plus className="w-2.5 h-2.5 stroke-[#FCFCFC]" strokeWidth={1.5} />
            Book
          </button>

          <button
            onClick={onMessageClick}
            className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-[20px] border border-[#E0DCDC] bg-[#0D9488] shadow-[0_4px_4px_0_rgba(0,0,0,0.25)] text-[#FFFAFA] text-sm font-medium hover:bg-[#0BA298] transition-colors"
          >
            <MessageCircleDashed className="w-3.25 h-3.25 stroke-[#FFF7F7]" strokeWidth={1.2} />
            Message
          </button>
        </div>
      </div>
    </div>
  );
}
