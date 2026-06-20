"use client";

import { useState } from "react";
import Image from "next/image";
import NextLink from "next/link";

import { Avatar, Button, Link } from "@heroui/react";
import { Bars, Xmark } from "@gravity-ui/icons";

const navItems = [
  { label: "Home", href: "/" },
  { label: "Donation Requests", href: "/donation-requests" },
  { label: "Funding", href: "/funding", auth: true },
];
const user = null;

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-default-200 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 container items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link>
          <Image
            src="/images/logo.png"
            alt="Logo"
            width={120}
            height={60}
            className="mr-2 rounded-full"
          />
        </Link>

        {/* Desktop Navigation */}
        <ul className="hidden items-center gap-8 lg:flex">
          {navItems
            .filter((item) => !item.auth)
            .map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  color="foreground"
                  className="font-medium transition-colors hover:text-danger"
                >
                  {item.label}
                </Link>
              </li>
            ))}
        </ul>

        {/* Desktop Actions */}
        <div className="hidden items-center gap-3 lg:flex">
          {!user ? (
            <Button as={NextLink} href="/login" color="danger" radius="full">
              Login
            </Button>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                color="foreground"
                className="font-medium"
              >
                Dashboard
              </Link>

              <Avatar
                src={user.image}
                name={user.name}
                size="sm"
                className="cursor-pointer"
              />
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <Button
          isIconOnly
          variant="light"
          className="lg:hidden"
          aria-label="Toggle menu"
          onPress={() => setIsMenuOpen((prev) => !prev)}
        >
          {isMenuOpen ? <Xmark size={22} /> : <Bars />}
        </Button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="border-t border-default-200 bg-background lg:hidden">
          <div className="space-y-1 px-4 py-4">
            {navItems
              .filter((item) => !item.auth || user)
              .map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  color="foreground"
                  className="flex w-full py-3 font-medium"
                  onPress={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}

            <div className="mt-4 border-t border-default-200 pt-4">
              {!user ? (
                <Button
                  href="/login"
                  color="danger"
                  className="w-full"
                  onPress={() => setIsMenuOpen(false)}
                >
                  Login
                </Button>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Avatar src={user.image} name={user.name} size="sm" />

                    <div>
                      <p className="text-sm font-semibold">{user.name}</p>

                      <p className="text-xs text-default-500">{user.role}</p>
                    </div>
                  </div>

                  <Button
                    href="/dashboard"
                    variant="flat"
                    className="w-full"
                    onPress={() => setIsMenuOpen(false)}
                  >
                    Dashboard
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
