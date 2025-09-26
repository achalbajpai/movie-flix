import { Button } from "@/components/ui/button"
import { Bus, User, Menu, Ticket, Search } from "lucide-react"
import Link from "next/link"

export function Header() {
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Bus className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-foreground">BusGo</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/results"
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <Search className="h-4 w-4" />
              Search Buses
            </Link>
            <Link
              href="/bookings"
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <Ticket className="h-4 w-4" />
              My Bookings
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <div className="flex md:hidden items-center gap-2">
              <Link href="/bookings">
                <Button variant="ghost" size="sm">
                  <Ticket className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            <Button variant="ghost" size="sm" className="hidden md:flex">
              <User className="h-4 w-4 mr-2" />
              Login
            </Button>
            <Button size="sm">Sign up</Button>
            <Button variant="ghost" size="sm" className="md:hidden">
              <Menu className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
