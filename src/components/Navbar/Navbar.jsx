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

const user = null;

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href) => pathname === href;

  return (
    <nav className="sticky top-0 z-50 w-full bg-slate-950/90 backdrop-blur-xl border-b border-slate-800 text-white">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <NextLink href="/" className="flex items-center gap-2">
          <Image
            src="/images/logo-auth.png"
            alt="RedHope Logo"
            width={150}
            height={150}
          />
        </NextLink>

        {/* Desktop Nav */}
        <ul className="hidden lg:flex items-center gap-8">
          {navItems
            .filter((item) => !item.auth)
            .map((item) => (
              <li key={item.href}>
                <Link
                  as={NextLink}
                  href={item.href}
                  className={`no-underline font-medium transition ${
                    isActive(item.href)
                      ? "text-red-500"
                      : "text-slate-300 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
        </ul>

        {/* Actions */}
        <div className="hidden lg:flex items-center gap-3">
          {!user ? (
            <Link
              as={NextLink}
              href="/login"
              radius="full"
              className="bg-red-500 w-full px-4 py-2 rounded-full no-underline text-white hover:bg-red-600"
            >
              Login
            </Link>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                as={NextLink}
                href="/dashboard"
                className={`font-medium no-underline ${
                  isActive("/dashboard")
                    ? "text-red-500"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                Dashboard
              </Link>

              <Dropdown placement="bottom-end">
                <DropdownTrigger>
                  <Avatar
                    src={user?.image}
                    name={user?.name}
                    size="sm"
                    className="cursor-pointer"
                  />
                </DropdownTrigger>

                <DropdownMenu aria-label="User Menu">
                  <DropdownItem as={NextLink} href="/dashboard">
                    Dashboard
                  </DropdownItem>

                  <DropdownItem
                    key="signout"
                    color="danger"
                    onPress={() => console.log("Sign out")}
                  >
                    Sign Out
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            </div>
          )}
        </div>

        {/* Mobile Button */}
        <Button
          isIconOnly
          variant="light"
          className="lg:hidden text-white"
          onPress={() => setIsMenuOpen((prev) => !prev)}
        >
          {isMenuOpen ? <Xmark /> : <Bars />}
        </Button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="lg:hidden border-t border-slate-800 bg-slate-950 text-white">
          <div className="px-4 py-4 space-y-2">
            {navItems
              .filter((item) => !item.auth || user)
              .map((item) => (
                <Link
                  key={item.href}
                  as={NextLink}
                  href={item.href}
                  onPress={() => setIsMenuOpen(false)}
                  className={`block py-2 ${
                    isActive(item.href) ? "text-red-500" : "text-slate-300"
                  }`}
                >
                  {item.label}
                </Link>
              ))}

            <div className="border-t border-slate-800 pt-4 mt-4">
              {!user ? (
                <Button
                  as={NextLink}
                  href="/login"
                  className="w-full bg-red-500 text-white"
                  onPress={() => setIsMenuOpen(false)}
                >
                  Login
                </Button>
              ) : (
                <div className="space-y-3">
                  <Button className="w-full bg-red-500 text-white">
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
