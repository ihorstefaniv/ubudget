"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const links = [
  { href: "/accounts", label: "Accounts" },
  { href: "/transactions", label: "Transactions" },
];

export default function NavLinks() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      {/* Desktop nav */}
      <nav className="hidden sm:flex items-center gap-8">
        {links.map(({ href, label }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`text-sm font-medium transition-colors duration-200 relative group ${
                isActive
                  ? "text-orange-400"
                  : "text-neutral-500 hover:text-orange-400"
              }`}
            >
              {label}
              <span
                className={`absolute -bottom-0.5 left-0 h-px bg-orange-400 transition-all duration-200 ${
                  isActive ? "w-full" : "w-0 group-hover:w-full"
                }`}
              />
            </Link>
          );
        })}
      </nav>

      {/* Mobile burger */}
      <div className="sm:hidden">
        <button
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle menu"
          className="flex flex-col justify-center items-center w-8 h-8 gap-1.5 group"
        >
          <span
            className={`block w-5 h-px bg-neutral-700 transition-all duration-300 origin-center ${
              menuOpen ? "rotate-45 translate-y-[7px]" : ""
            }`}
          />
          <span
            className={`block w-5 h-px bg-neutral-700 transition-all duration-300 ${
              menuOpen ? "opacity-0 scale-x-0" : ""
            }`}
          />
          <span
            className={`block w-5 h-px bg-neutral-700 transition-all duration-300 origin-center ${
              menuOpen ? "-rotate-45 -translate-y-[7px]" : ""
            }`}
          />
        </button>

        {/* Mobile dropdown */}
        <div
          className={`absolute top-16 left-0 right-0 bg-neutral-50 border-b border-neutral-100 shadow-sm transition-all duration-300 overflow-hidden ${
            menuOpen ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <nav className="flex flex-col px-6 py-4 gap-4">
            {links.map(({ href, label }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className={`text-sm font-medium transition-colors duration-200 ${
                    isActive
                      ? "text-orange-400"
                      : "text-neutral-500 hover:text-orange-400"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </>
  );
}
