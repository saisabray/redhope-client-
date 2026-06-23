"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import NextLink from "next/link";
import { Link } from "@heroui/react";
import { authClient } from "@/lib/auth-client";

export default function Banner() {

  const { data: session } = authClient.useSession();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const user = mounted ? session?.user : null;
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden">
      {/* Background */}
      <Image
        src="/images/banner.png"
        alt="Banner"
        fill
        priority
        className="object-cover"
      />

      {/* Lighter overlay (less heavy than before) */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Content */}
      <div className="relative z-10 flex w-full justify-center px-4">
        <div className="max-w-3xl text-center">
          {/* Badge(reduced blur) */}
          <div className="mb-6 inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-5 py-2 text-sm text-gray-200">
            <Image
              src="/images/blood-drop.png"
              alt="blood drop"
              width={20}
              height={20}
              className="object-contain"
            />
            Every donation can save up to three lives
          </div>
          {/* Heading */}
          <h1 className="text-4xl font-extrabold leading-tight text-white md:text-6xl">
            Donate Blood.
            <span className="block text-red-500">Share Hope. Save Lives.</span>
          </h1>
          {/* Description */}
          <p className="mx-auto mt-5 max-w-2xl text-base text-gray-200 md:text-lg">
            Connect with verified donors and help patients in critical need.
            Your small action can make a life-changing impact.
          </p>
          {/* CTAs */}
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              as={NextLink}
              href={user ? "/dashboard/donor" : "/signup"}
              className="rounded-full no-underline bg-red-600 px-6 py-3 font-semibold text-white transition hover:bg-red-700"
            >
              Become a Donor
            </Link>

            <Link
              as={NextLink}
              href="/search"
              className="rounded-full no-underline bg-white/10 px-6 py-3 font-semibold text-white transition hover:bg-white/20 focus:outline-none focus:ring-0"
            >
              Search Donors
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
