"use client";

import { useState } from "react";
import Image from "next/image";
import NextLink from "next/link";
import {
  Avatar,
  Button,
  Link,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/react";
import { Bars, Xmark } from "@gravity-ui/icons";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "Home", href: "/" },
  { label: "Donation Requests", href: "/donation-requests" },
  { label: "Funding", href: "/funding", auth: true },
];

// replace this later with real auth (NextAuth / JWT)
const user = null;

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href) => pathname === href;

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/70 backdrop-blur-xl border-b border-gray-200">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <NextLink href="/" className="flex items-center">
          <Image
            src="/images/logo.png"
            alt="Logo"
            width={120}
            height={60}
            className="rounded-full"
          />
        </NextLink>

        {/* Desktop Navigation */}
        <ul className="hidden items-center gap-8 lg:flex">
          {navItems
            .filter((item) => !item.auth)
            .map((item) => (
              <li key={item.href}>
                <Link
                  as={NextLink}
                  href={item.href}
                  className={`no-underline font-medium transition-colors hover:text-danger ${
                    isActive(item.href)
                      ? "text-danger underline decoration-red-500 underline-offset-8"
                      : "text-foreground"
                  }`}
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
                as={NextLink}
                href="/dashboard"
                className={`font-medium no-underline ${
                  isActive("/dashboard") ? "text-danger" : "text-foreground"
                }`}
              >
                Dashboard
              </Link>

              {/* Avatar Dropdown */}
              <Dropdown placement="bottom-end">
                <DropdownTrigger>
                  <Avatar
                    src={user.image}
                    name={user.name}
                    size="sm"
                    className="cursor-pointer"
                  />
                </DropdownTrigger>

                <DropdownMenu aria-label="User Menu">
                  <DropdownItem key="dashboard" as={NextLink} href="/dashboard">
                    Dashboard
                  </DropdownItem>

                  <DropdownItem
                    key="signout"
                    color="danger"
                    onPress={() => {
                      console.log("Sign out clicked");
                      // later: signOut()
                    }}
                  >
                    Sign Out
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
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
        <div className="border-t border-gray-200 bg-white lg:hidden">
          <div className="space-y-1 px-4 py-4">
            {/* Nav Links */}
            {navItems
              .filter((item) => !item.auth || user)
              .map((item) => (
                <Link
                  key={item.href}
                  as={NextLink}
                  href={item.href}
                  className={`flex w-full py-3 font-medium no-underline ${
                    isActive(item.href)
                      ? "text-danger underline underline-offset-8"
                      : "text-foreground"
                  }`}
                  onPress={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}

            <div className="mt-4 border-t border-default-200 pt-4">
              {!user ? (
                <Link
                  as={NextLink}
                  href="/login"
                  color="danger"
                  className="w-full no-underline"
                  onPress={() => setIsMenuOpen(false)}
                >
                  Login
                </Link>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Avatar src={user.image} name={user.name} size="sm" />

                    <div>
                      <p className="text-sm font-semibold">{user.name}</p>
                      <p className="text-xs text-default-500">{user.role}</p>
                    </div>
                  </div>

                  <Link
                    as={NextLink}
                    href="/dashboard"
                    className="w-full no-underline"
                    onPress={() => setIsMenuOpen(false)}
                  >
                    Dashboard
                  </Link>

                  <Button
                    color="danger"
                    className="w-full"
                    onPress={() => {
                      console.log("Sign out clicked");
                      // later: signOut()
                    }}
                  >
                    Sign Out
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
