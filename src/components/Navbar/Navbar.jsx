"use client";

import { useState } from "react";
import Image from "next/image";
import NextLink from "next/link";
import {
  Avatar,
  Button,
  Link,
  Dropdown,
} from "@heroui/react";
import { Bars, Xmark } from "@gravity-ui/icons";
import { usePathname, useRouter } from "next/navigation";
import { authClient, signOut } from "@/lib/auth-client";

const navItems = [
  { label: "Home", href: "/" },
  { label: "Donation Requests", href: "/donation-requests" },
  { label: "Search Blood", href: "/search" },
  { label: "Funding", href: "/funding", auth: true },
];

export default function Navbar() { 
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const user = session?.user;
  const isActive = (href) => pathname === href;
  const dashboardHref = user?.role ? `/dashboard/${user.role}` : "/dashboard";

  if (pathname?.startsWith("/dashboard")) return null;

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
    router.refresh();
  };

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
            priority
            className="w-[150px] h-auto"
          />
        </NextLink>

        {/* Desktop Nav */}
        <ul className="hidden lg:flex items-center gap-8">
          {navItems
            .filter((item) => !item.auth || user)
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
              <Dropdown>
                <Dropdown.Trigger>
                  <Avatar
                   className="cursor-pointer ring-2 ring-red-500"
                >
                        <Avatar.Image
                         src={user?.image}
                         alt={user?.name}
                       />
                        <Avatar.Fallback>
                            {user?.name?.[0]?.toUpperCase()}
                        </Avatar.Fallback>
                </Avatar>
                </Dropdown.Trigger>

                <Dropdown.Popover className="min-w-44 rounded-xl bg-slate-900 border border-slate-700 shadow-xl shadow-black/40 p-1">
                  <Dropdown.Menu className="bg-transparent">
                    <Dropdown.Item
                      as={NextLink}
                      href={dashboardHref}
                      className="text-slate-200 hover:bg-slate-800 hover:text-white rounded-lg px-3 py-2"
                    >
                      Dashboard
                    </Dropdown.Item>

                    <Dropdown.Item
                      key="signout"
                      onAction={handleSignOut}
                      className="text-red-400 hover:bg-slate-800 hover:text-red-300 rounded-lg px-3 py-2"
                    >
                      Sign Out
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown.Popover>
              </Dropdown>
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
                <Link
                  as={NextLink}
                  href="/login"
                  className="w-full bg-red-500 text-white"
                  onPress={() => setIsMenuOpen(false)}
                >
                  Login
                </Link>
              ) : (
                <div className="space-y-3">
                  <Button
                    className="w-full bg-red-500 text-white"
                    onPress={() => {
                      setIsMenuOpen(false);
                      handleSignOut();
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
