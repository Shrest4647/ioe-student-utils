"use client";

import { Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { UserMenu } from "@/components/auth/user-menu";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative h-8 w-8">
              <Image
                src="/logo.svg"
                alt="Logo"
                fill
                className="object-contain"
              />
            </div>
            <span className="font-bold text-xl">IOESU</span>
          </div>

          <div className="hidden md:block">
            <div className="flex items-center space-x-8">
              <Link
                href="#mission"
                passHref
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Mission
              </Link>
              <Link
                href="#features"
                passHref
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Features
              </Link>

              <UserMenu />
            </div>
          </div>

          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {isOpen && (
          <div className="md:hidden">
            <div className="space-y-1 px-2 pt-2 pb-3">
              <Link
                href="#mission"
                className="block px-3 py-2 text-muted-foreground hover:text-foreground"
              >
                Mission
              </Link>
              <Link
                href="#features"
                className="block px-3 py-2 text-muted-foreground hover:text-foreground"
              >
                Features
              </Link>

              <div className="px-3 pt-2">
                <UserMenu />
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
