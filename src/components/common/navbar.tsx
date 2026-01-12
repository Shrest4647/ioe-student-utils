"use client";

import {
  Award,
  BookOpen,
  Building2,
  FileText,
  Folder,
  GraduationCap,
  LayoutDashboard,
  Menu,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import * as React from "react";
import { UserMenu } from "@/components/auth/user-menu";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { useAuth } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [isOpen, setIsOpen] = React.useState(false);
  const { isAuthenticated } = useAuth();
  const isMobile = useIsMobile();

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2">
              <div className="relative h-8 w-8">
                <Image
                  src="/logo.svg"
                  alt="Logo"
                  fill
                  className="object-contain"
                />
              </div>
              <span className="font-bold text-xl">IOESU</span>
            </Link>
          </div>

          <div className="hidden md:block">
            <NavigationMenu viewport={isMobile}>
              <NavigationMenuList className="flex-wrap gap-1">
                <NavigationMenuItem>
                  <NavigationMenuTrigger>
                    <span className="text-sm">Universities</span>
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid gap-2 p-4 md:w-100 lg:w-125 lg:grid-cols-[.75fr_1fr]">
                      <li className="row-span-3">
                        <NavigationMenuLink asChild>
                          <Link
                            className="flex h-full w-full select-none flex-col justify-end rounded-md bg-linear-to-b from-muted/50 to-muted p-4 no-underline outline-hidden transition-all duration-200 focus:shadow-md md:p-6"
                            href="/universities"
                          >
                            <Building2 className="mb-2 h-10 w-10" />
                            <div className="mb-2 font-medium text-lg">
                              Universities
                            </div>
                            <p className="text-muted-foreground text-sm leading-tight">
                              Explore universities, colleges, departments,
                              programs, and courses.
                            </p>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                      <ListItem href="/universities" title="Universities">
                        Browse all universities and their detailed information.
                      </ListItem>
                      <ListItem href="/colleges" title="Colleges">
                        Explore colleges under different universities.
                      </ListItem>
                      <ListItem href="/departments" title="Departments">
                        Find departments and their offerings.
                      </ListItem>
                      <ListItem href="/programs" title="Programs">
                        Discover academic programs and degrees.
                      </ListItem>
                      <ListItem href="/courses" title="Courses">
                        Browse courses and their details.
                      </ListItem>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuLink
                    asChild
                    className={navigationMenuTriggerStyle()}
                  >
                    <Link href="/resources">
                      <span className="text-sm">Resources</span>
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink
                    asChild
                    className={navigationMenuTriggerStyle()}
                  >
                    <Link href="/scholarships">
                      <span className="text-sm">Scholarships</span>
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>

                {isAuthenticated && (
                  <NavigationMenuItem>
                    <NavigationMenuTrigger>
                      <span className="text-sm">Dashboard</span>
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <ul className="grid gap-2 p-4 md:w-100 md:grid-cols-2">
                        <ListItem href="/dashboard" title="Overview">
                          Manage your dashboard and activities.
                        </ListItem>
                        <ListItem
                          href="/dashboard/universities"
                          title="Universities"
                        >
                          Manage university content.
                        </ListItem>
                        <ListItem href="/dashboard/colleges" title="Colleges">
                          Manage college content.
                        </ListItem>
                        <ListItem
                          href="/dashboard/departments"
                          title="Departments"
                        >
                          Manage department content.
                        </ListItem>
                        <ListItem href="/dashboard/programs" title="Programs">
                          Manage program content.
                        </ListItem>
                        <ListItem href="/dashboard/courses" title="Courses">
                          Manage course content.
                        </ListItem>
                        <ListItem
                          href="/dashboard/scholarships"
                          title="Scholarships"
                        >
                          Manage scholarship opportunities.
                        </ListItem>
                        <ListItem href="/dashboard/resources" title="Resources">
                          Manage educational resources.
                        </ListItem>
                        <ListItem
                          href="/dashboard/rating-categories"
                          title="Rating Categories"
                        >
                          Manage rating categories.
                        </ListItem>
                        <ListItem href="/dashboard/settings" title="Settings">
                          Configure your account settings.
                        </ListItem>
                      </ul>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                )}

                <NavigationMenuItem>
                  <UserMenu />
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
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
              <div className="space-y-1 border-b pb-2">
                <p className="px-3 py-2 font-semibold text-foreground text-sm">
                  Universities
                </p>
                <MobileLink
                  href="/universities"
                  icon={<Building2 className="h-4 w-4" />}
                >
                  All Universities
                </MobileLink>
                <MobileLink
                  href="/colleges"
                  icon={<Folder className="h-4 w-4" />}
                >
                  Colleges
                </MobileLink>
                <MobileLink
                  href="/departments"
                  icon={<GraduationCap className="h-4 w-4" />}
                >
                  Departments
                </MobileLink>
                <MobileLink
                  href="/programs"
                  icon={<BookOpen className="h-4 w-4" />}
                >
                  Programs
                </MobileLink>
                <MobileLink
                  href="/courses"
                  icon={<FileText className="h-4 w-4" />}
                >
                  Courses
                </MobileLink>
              </div>

              <MobileLink
                href="/resources"
                icon={<FileText className="h-4 w-4" />}
              >
                Resources
              </MobileLink>

              {isAuthenticated && (
                <div className="space-y-1 border-t pt-2">
                  <p className="px-3 py-2 font-semibold text-foreground text-sm">
                    Dashboard
                  </p>
                  <MobileLink
                    href="/dashboard"
                    icon={<LayoutDashboard className="h-4 w-4" />}
                  >
                    Overview
                  </MobileLink>
                  <MobileLink
                    href="/dashboard/universities"
                    icon={<Building2 className="h-4 w-4" />}
                  >
                    Universities
                  </MobileLink>
                  <MobileLink
                    href="/dashboard/colleges"
                    icon={<Folder className="h-4 w-4" />}
                  >
                    Colleges
                  </MobileLink>
                  <MobileLink
                    href="/dashboard/departments"
                    icon={<GraduationCap className="h-4 w-4" />}
                  >
                    Departments
                  </MobileLink>
                  <MobileLink
                    href="/dashboard/programs"
                    icon={<BookOpen className="h-4 w-4" />}
                  >
                    Programs
                  </MobileLink>
                  <MobileLink
                    href="/dashboard/courses"
                    icon={<FileText className="h-4 w-4" />}
                  >
                    Courses
                  </MobileLink>
                  <MobileLink
                    href="/dashboard/scholarships"
                    icon={<Award className="h-4 w-4" />}
                  >
                    Scholarships
                  </MobileLink>
                  <MobileLink
                    href="/dashboard/resources"
                    icon={<FileText className="h-4 w-4" />}
                  >
                    Resources
                  </MobileLink>
                  <MobileLink
                    href="/dashboard/rating-categories"
                    icon={<FileText className="h-4 w-4" />}
                  >
                    Rating Categories
                  </MobileLink>
                  <MobileLink
                    href="/dashboard/settings"
                    icon={<LayoutDashboard className="h-4 w-4" />}
                  >
                    Settings
                  </MobileLink>
                </div>
              )}

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

const ListItem = ({
  className,
  title,
  children,
  href,
  ref,
  ...props
}: React.ComponentPropsWithRef<"a"> & { title: string }) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <Link
          ref={ref}
          className={cn(
            "block select-none space-y-1 rounded-md p-3",
            className,
          )}
          href={href ?? "#"}
          {...props}
        >
          <div className="flex flex-col">
            <div className="font-medium text-sm leading-none hover:underline">
              {title}
            </div>
            <p className="line-clamp-2 text-muted-foreground text-sm leading-snug">
              {children}
            </p>
          </div>
        </Link>
      </NavigationMenuLink>
    </li>
  );
};

function MobileLink({
  href,
  children,
  icon,
  className,
}: {
  href: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 px-6 py-2 text-muted-foreground hover:text-foreground",
        className,
      )}
    >
      {icon}
      <span>{children}</span>
    </Link>
  );
}
