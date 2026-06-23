"use client";

import Link from "next/link";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Forbidden() {
  const router = useRouter();

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-slate-950 px-4">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20">
            <ShieldAlert size={48} className="text-red-500" />
          </div>
        </div>
        <h1 className="text-4xl font-extrabold text-slate-100 mb-4">
          Access Denied
        </h1>
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 mb-8">
          <p className="text-slate-400 mb-2">
            You do not have permission to access this page. 
          </p>
          <p className="text-sm text-slate-500">
            Error Code: 403 Forbidden
          </p>
        </div>
        <div className="flex justify-center gap-4">
          <button 
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-xl font-medium transition-colors"
          >
            <ArrowLeft size={18} />
            Go Back
          </button>
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-medium transition-colors"
          >
            Home Page
          </Link>
        </div>
      </div>
    </div>
  );
}
