import { SearchForm } from "@/components/search-form"
import { Header } from "@/components/header"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-20 md:py-32">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 text-balance">
              Find Your Perfect Bus Journey
            </h1>
            <p className="text-xl text-muted-foreground text-pretty">
              Currently in-progress
            </p>
          </div>
          <SearchForm />
        </div>
      </main>
    </div>
  )
}
