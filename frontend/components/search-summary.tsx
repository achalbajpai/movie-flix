"use client"

import { useSearchParams } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeftRight, Calendar, MapPin, Edit } from "lucide-react"

export function SearchSummary() {
  const searchParams = useSearchParams()
  const from = searchParams.get("source") || ""
  const to = searchParams.get("destination") || ""
  const date = searchParams.get("departureDate") || ""
  const returnDate = searchParams.get("returnDate")

  const formatDate = (dateString: string) => {
    if (!dateString) return "Select Date"
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return "Invalid Date"
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <Card className="p-6 bg-card border-0 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold text-foreground">{from}</span>
            <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold text-foreground">{to}</span>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-foreground">{formatDate(date)}</span>
            {returnDate && (
              <>
                <span className="text-muted-foreground">•</span>
                <span className="text-foreground">{formatDate(returnDate)}</span>
              </>
            )}
          </div>
        </div>

        <Button variant="outline" size="sm">
          <Edit className="h-4 w-4 mr-2" />
          Modify Search
        </Button>
      </div>
    </Card>
  )
}
