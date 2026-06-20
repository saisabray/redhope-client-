"use client";

import {
  Envelope,
  LogoFacebook,
  LogoGithub,
  LogoTelegram,
  MapPin,
  Handset,
} from "@gravity-ui/icons";
import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-white">
      <div className="container mx-auto px-6 py-16 ">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
          {/* Logo Section */}

          <div >
            <Image
              src="/images/logo.png"
              alt="RedHope Logo"
              width={220}
              height={220}
              
            />
            <p className="text-slate-400 text-sm leading-relaxed">
              RedHope is a life-saving platform that connects blood donors with
              people in urgent need. Join us and help save lives.
            </p>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-xl font-semibold mb-5">Contact Us</h3>

            <div className="space-y-4 text-slate-300">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 mt-1 text-red-400" />
                <p>Dhaka, Bangladesh</p>
              </div>

              <div className="flex items-center gap-3">
                <Handset className="w-5 h-5 text-red-400" />
                <p>+880 1234-567890</p>
              </div>

              <div className="flex items-center gap-3">
                <Envelope className="w-5 h-5 text-red-400" />
                <p>support@redhope.com</p>
              </div>
            </div>
          </div>

          {/* Social Section */}
          <div>
            <h3 className="text-xl font-semibold mb-5">Follow Us</h3>

            <div className="flex items-center gap-4">
              <Link
                href="https://facebook.com"
                target="_blank"
                className="w-11 h-11 rounded-full bg-slate-800 flex items-center justify-center hover:bg-red-600 transition"
              >
                <LogoFacebook className="w-5 h-5" />
              </Link>

              <Link
                href="https://telegram.org"
                target="_blank"
                className="w-11 h-11 rounded-full bg-slate-800 flex items-center justify-center hover:bg-cyan-500 transition"
              >
                <LogoTelegram className="w-5 h-5" />
              </Link>

              <Link
                href="https://github.com"
                target="_blank"
                className="w-11 h-11 rounded-full bg-slate-800 flex items-center justify-center hover:bg-gray-700 transition"
              >
                <LogoGithub className="w-5 h-5" />
              </Link>
            </div>

            <p className="text-slate-400 mt-6 text-sm leading-relaxed">
              Stay connected with RedHope for donation updates, emergency
              requests, and life-saving campaigns.
            </p>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-slate-800 mt-12 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-400 text-sm text-center">
            © {new Date().getFullYear()} RedHope. All rights reserved.
          </p>

          <div className="flex items-center gap-6 text-sm text-slate-400">
            <Link
              href="/privacy-policy"
              className="hover:text-red-400 transition"
            >
              Privacy Policy
            </Link>

            <Link href="/terms" className="hover:text-red-400 transition">
              Terms & Conditions
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
