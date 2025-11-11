import { cn } from "@/lib/utils";

interface DoctorCardProps {
  name: string;
  specialty: string;
  clinic: string;
  image?: string;
  className?: string;
}

export default function DoctorCard({
  name,
  specialty,
  clinic,
  image,
  className,
}: DoctorCardProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-4 p-3 rounded-[20px] border border-[#CAC5C5] bg-[rgba(253,251,251,0.29)]",
        className
      )}
    >
      <div className="w-[70px] h-16 rounded-full bg-gray-300 flex-shrink-0 overflow-hidden">
        {image ? (
          <img src={image} alt={name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-teal-primary to-teal-dark flex items-center justify-center text-white text-2xl font-bold">
            {name.charAt(3)}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-lg lg:text-xl font-medium text-black truncate">{name}</h3>
        <p className="text-xs lg:text-sm font-medium text-black">{specialty}</p>
        <p className="text-xs lg:text-sm font-medium text-[#A29C9C]">{clinic}</p>
      </div>
    </div>
  );
}
