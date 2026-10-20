import Link from "next/link";
import { RobotIcon } from "@/components/icons";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#FBF7EE] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white border border-[#ECE6D8] rounded-[24px] p-8 text-center space-y-5 shadow-xl">
        <div className="w-14 h-14 rounded-2xl bg-[#FAF0D7] border border-[#EEDB9F] flex items-center justify-center text-[#9A6400] mx-auto shadow-sm">
          <RobotIcon className="w-8 h-8" />
        </div>
        <div className="space-y-1.5">
          <span className="text-xs font-mono font-bold text-[#9A6400] bg-[#FAF0D7] px-2.5 py-1 rounded-full uppercase tracking-wider">
            HTTP 404 · Page Not Found
          </span>
          <h1 className="font-display font-bold text-2xl text-[#1C1F3A] pt-2">
            Lost in the Pipeline?
          </h1>
          <p className="text-xs sm:text-sm text-[#4A4F66] leading-relaxed">
            The page or client portal link you requested does not exist or has been relocated.
          </p>
        </div>

        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 w-full py-3 px-5 bg-[#1C1F3A] hover:bg-[#14172C] text-white font-bold text-sm rounded-xl transition-all shadow-sm"
          >
            ← Return to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}

