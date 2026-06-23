import Link from "next/link";
import { AlertCircle, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-slate-950 px-4">
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20">
            <AlertCircle size={48} className="text-red-500" />
          </div>
        </div>
        <h1 className="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-rose-500 mb-4">
          404
        </h1>
        <h2 className="text-2xl font-bold text-slate-100 mb-4">Page Not Found</h2>
        <p className="text-slate-400 mb-8 max-w-md mx-auto">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-medium transition-colors"
        >
          <Home size={18} />
          Back to Home
        </Link>
      </div>
    </div>
  );
}
