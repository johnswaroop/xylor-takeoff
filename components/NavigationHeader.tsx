"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  User,
  LogOut,
  Settings,
  Users,
  BarChart3,
  ChevronDown,
} from "lucide-react";
import { UserRole } from "@/lib/types/user-roles";

interface NavigationHeaderProps {
  showNavigation?: boolean;
}

export function NavigationHeader({
  showNavigation = true,
}: NavigationHeaderProps) {
  const { user, logout } = useAuth();
  const router = useRouter();

  // Get user initials for avatar fallback
  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Handle logout with redirect
  const handleLogout = async () => {
    try {
      await logout();
      router.push("/auth/login");
    } catch (error) {
      console.error("Logout error:", error);
      // Still redirect even if logout fails
      router.push("/auth/login");
    }
  };

  // Get role-based navigation items
  const getNavigationItems = () => {
    if (!user) return [];

    const items = [];

    // BD role navigation
    if (user.roles.includes(UserRole.BD)) {
      items.push(
        { href: "/bd/dashboard", label: "Dashboard", icon: BarChart3 },
        { href: "/bd/leads", label: "Leads", icon: Users },
        { href: "/bd/leads/create", label: "Create Lead", icon: Users }
      );
    }

    // Estimator role navigation
    if (user.roles.includes(UserRole.ESTIMATOR)) {
      items.push(
        { href: "/estimator/dashboard", label: "Dashboard", icon: BarChart3 },
        { href: "/estimator/projects", label: "Projects", icon: Users }
      );
    }

    // Admin role navigation
    if (user.roles.includes(UserRole.ADMIN)) {
      items.push(
        { href: "/admin/dashboard", label: "Admin Dashboard", icon: BarChart3 },
        { href: "/admin/users", label: "User Management", icon: Users }
      );
    }

    return items;
  };

  const navigationItems = getNavigationItems();

  if (!user) {
    return null;
  }

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 mx-auto w-full items-center">
      <div className="container flex h-16 items-center justify-between px-4 mx-auto">
        {/* Logo/Brand */}
        <div className="flex items-center space-x-6">
          <Link href="/" className="flex items-center space-x-2">
            <h1 className="text-xl font-bold">
              Xylor<span className="text-blue-600">.AI</span>
            </h1>
          </Link>

          {/* Navigation Items */}
          {showNavigation && navigationItems.length > 0 && (
            <nav className="hidden md:flex items-center space-x-6">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center space-x-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div className="flex items-center space-x-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center space-x-2 h-auto py-2"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src="" alt={user.name} />
                  <AvatarFallback className="text-sm">
                    {getUserInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:flex flex-col items-start text-sm">
                  <span className="font-medium">{user.name}</span>
                  <span className="text-muted-foreground text-xs">
                    {user.roles.join(", ")}
                  </span>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user.name}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link
                  href="/profile"
                  className="flex items-center cursor-pointer"
                >
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href="/settings"
                  className="flex items-center cursor-pointer"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
