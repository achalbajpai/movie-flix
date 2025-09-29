'use client'

import { Button } from "@/components/ui/button"
import { Bus, Menu } from "lucide-react"
import Link from "next/link"
import { LoginButton } from "@/components/auth/login-button"
import { UserMenu } from "@/components/auth/user-menu"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAuth } from "@/lib/auth-context"

export function Header() {
  const { user, loading } = useAuth()

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Bus className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-foreground">BusGo</span>
          </Link>

          <div className="flex items-center gap-3">
            <ThemeToggle />

            {loading ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900" />
            ) : user ? (
              <UserMenu />
            ) : (
              <div className="flex items-center gap-2">
                <LoginButton />
              </div>
            )}

            <Button variant="ghost" size="sm" className="md:hidden">
              <Menu className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
