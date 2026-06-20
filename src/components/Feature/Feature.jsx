"use client";

import {
  HeartPulse,
  Search,
  Users,
  ShieldCheck,
  HandCoins,
  BellRing,
} from "lucide-react";

import { Card } from "@heroui/react";

const features = [
  {
    icon: HeartPulse,
    title: "Save Lives Easily",
    desc: "Connect instantly with blood donors during emergencies and save lives in time.",
  },
  {
    icon: Search,
    title: "Find Donors Fast",
    desc: "Search donors by blood group, district, and upazila within seconds.",
  },
  {
    icon: Users,
    title: "Large Donor Network",
    desc: "A growing community of verified donors ready to help anytime.",
  },
  {
    icon: ShieldCheck,
    title: "Secure & Trusted System",
    desc: "Role-based access control with secure authentication for all users.",
  },
  {
    icon: HandCoins,
    title: "Funding Support",
    desc: "Users can contribute funds to support life-saving blood operations.",
  },
  {
    icon: BellRing,
    title: "Emergency Alerts",
    desc: "Instant notifications for urgent blood donation requests.",
  },
];

export default function Feature() {
  return (
    <section className="py-20 bg-slate-950 text-white">
      <div className="container mx-auto px-6 max-w-6xl">
        {/* Heading */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold">
            Why Choose <span className="text-red-500">RedHope</span>
          </h2>
          <p className="text-slate-400 mt-3 max-w-2xl mx-auto">
            A modern blood donation platform designed to connect donors,
            volunteers, and patients in real time.
          </p>
        </div>

        {/* Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 justify-items-center">
          {features.map((item, index) => (
            <Card
              key={index}
              className="w-full max-w-sm bg-slate-900 border border-slate-800 hover:border-red-500 transition text-center"
            >
              {/* Header */}
              <Card.Header className="flex flex-col items-center gap-3 text-center">
                <div className="w-12 h-12 flex items-center justify-center rounded-full bg-red-500/10 text-red-500">
                  <item.icon className="w-5 h-5" />
                </div>

                <Card.Title className="text-white text-base font-semibold">
                  {item.title}
                </Card.Title>
              </Card.Header>

              {/* Content */}
              <Card.Content className="text-center">
                <p className="text-slate-400 text-sm leading-relaxed">
                  {item.desc}
                </p>
              </Card.Content>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
