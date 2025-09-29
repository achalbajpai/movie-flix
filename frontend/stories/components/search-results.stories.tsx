import type { Meta, StoryObj } from "@storybook/react";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Separator } from "../../components/ui/separator";
import { MapPin, Star, Wifi, Zap, Snowflake, Users } from "lucide-react";
import { useState } from "react";

const mockBuses = [
  {
    id: "1",
    operatorName: "RedBus Express",
    busType: "AC Sleeper",
    departureTime: "22:30",
    arrivalTime: "06:00",
    duration: "7h 30m",
    price: 1200,
    availableSeats: 15,
    rating: 4.2,
    amenities: ["WiFi", "Charging Point", "Blanket", "Water Bottle"],
    departureCity: "Delhi",
    arrivalCity: "Mumbai",
    boardingPoints: ["Kashmere Gate", "Anand Vihar"],
    droppingPoints: ["Borivali", "Andheri"]
  },
  {
    id: "2", 
    operatorName: "VRL Travels",
    busType: "Non-AC Seater",
    departureTime: "23:00",
    arrivalTime: "07:30",
    duration: "8h 30m",
    price: 800,
    availableSeats: 8,
    rating: 3.9,
    amenities: ["Water Bottle", "Reading Light"],
    departureCity: "Delhi",
    arrivalCity: "Mumbai",
    boardingPoints: ["ISBT Kashmere Gate"],
    droppingPoints: ["Mumbai Central"]
  },
  {
    id: "3",
    operatorName: "Orange Travels",
    busType: "AC Seater",
    departureTime: "21:00",
    arrivalTime: "05:30",
    duration: "8h 30m", 
    price: 950,
    availableSeats: 22,
    rating: 4.0,
    amenities: ["WiFi", "Charging Point", "Snacks"],
    departureCity: "Delhi",
    arrivalCity: "Mumbai",
    boardingPoints: ["Kashmere Gate", "Sarai Kale Khan"],
    droppingPoints: ["Thane", "Borivali", "Andheri"]
  }
];

interface SearchResultsProps {
  buses: typeof mockBuses;
  loading: boolean;
}

// Simplified SearchResults component for Storybook
const SearchResultsDemo = ({ buses, loading }: SearchResultsProps) => {
  const [sortBy, setSortBy] = useState("price");

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-6 bg-muted rounded w-1/3"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
              <div className="h-4 bg-muted rounded w-1/4"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (buses.length === 0) {
    return (
      <Card className="p-8 text-center">
        <h3 className="text-lg font-medium mb-2">No buses found</h3>
        <p className="text-muted-foreground">Try adjusting your search criteria</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {buses.length} buses found
        </p>
        <select 
          value={sortBy} 
          onChange={(e) => setSortBy(e.target.value)}
          className="text-sm border rounded px-2 py-1"
        >
          <option value="price">Sort by Price</option>
          <option value="rating">Sort by Rating</option>
          <option value="departure">Sort by Departure</option>
        </select>
      </div>
      
      {buses.map((bus) => (
        <Card key={bus.id} className="p-6">
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">{bus.operatorName}</h3>
                <Badge variant="secondary">{bus.busType}</Badge>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium">{bus.rating}</span>
                </div>
              </div>
              <div className="text-right space-y-1">
                <p className="text-2xl font-bold">₹{bus.price}</p>
                <p className="text-sm text-muted-foreground">{bus.availableSeats} seats available</p>
              </div>
            </div>

            <Separator />

            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-lg font-medium">
                  <span>{bus.departureTime}</span>
                  <MapPin className="h-4 w-4" />
                  <span>{bus.departureCity}</span>
                </div>
                <div className="flex items-center gap-2 text-lg font-medium">
                  <span>{bus.arrivalTime}</span>
                  <MapPin className="h-4 w-4" />
                  <span>{bus.arrivalCity}</span>
                </div>
                <p className="text-sm text-muted-foreground">Duration: {bus.duration}</p>
              </div>

              <Button size="lg">
                Select Seats
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {bus.amenities.map((amenity) => {
                const iconMap: Record<string, React.ReactElement> = {
                  "WiFi": <Wifi className="h-3 w-3" />,
                  "Charging Point": <Zap className="h-3 w-3" />,
                  "Blanket": <Snowflake className="h-3 w-3" />,
                  "Water Bottle": <Users className="h-3 w-3" />
                };
                
                return (
                  <Badge key={amenity} variant="outline" className="text-xs">
                    {iconMap[amenity] || <Users className="h-3 w-3" />}
                    <span className="ml-1">{amenity}</span>
                  </Badge>
                );
              })}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

const meta = {
  title: "Components/SearchResults",
  component: SearchResultsDemo,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: "Display search results for bus routes with booking options and filters.",
      },
    },
  },
  argTypes: {
    loading: {
      description: "Whether the search results are loading",
      control: { type: "boolean" },
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof SearchResultsDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {
    buses: mockBuses,
    loading: false,
  },
};

export const Loading: Story = {
  args: {
    buses: [],
    loading: true,
  },
};

export const EmptyResults: Story = {
  args: {
    buses: [],
    loading: false,
  },
};