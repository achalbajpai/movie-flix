import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { ArrowLeftRight, MapPin, Calendar, Search } from "lucide-react";
import { useState } from "react";

// Simplified SearchForm component for Storybook
const SearchFormDemo = () => {
  const [fromCity, setFromCity] = useState("");
  const [toCity, setToCity] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [passengers, setPassengers] = useState("1");

  const swapCities = () => {
    const temp = fromCity;
    setFromCity(toCity);
    setToCity(temp);
  };

  return (
    <Card className="p-6 w-full">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          {/* From City */}
          <div className="md:col-span-4 space-y-2">
            <Label htmlFor="from">From</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="from"
                placeholder="Departure city"
                value={fromCity}
                onChange={(e) => setFromCity(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Swap Button */}
          <div className="md:col-span-1 flex justify-center">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={swapCities}
              className="rounded-full"
            >
              <ArrowLeftRight className="h-4 w-4" />
            </Button>
          </div>

          {/* To City */}
          <div className="md:col-span-4 space-y-2">
            <Label htmlFor="to">To</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="to"
                placeholder="Destination city"
                value={toCity}
                onChange={(e) => setToCity(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Date */}
          <div className="md:col-span-3 space-y-2">
            <Label htmlFor="date">Departure Date</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="date"
                type="date"
                value={departureDate}
                onChange={(e) => setDepartureDate(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          {/* Passengers */}
          <div className="md:col-span-3 space-y-2">
            <Label htmlFor="passengers">Passengers</Label>
            <Select value={passengers} onValueChange={setPassengers}>
              <SelectTrigger>
                <SelectValue placeholder="Select passengers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 Passenger</SelectItem>
                <SelectItem value="2">2 Passengers</SelectItem>
                <SelectItem value="3">3 Passengers</SelectItem>
                <SelectItem value="4">4 Passengers</SelectItem>
                <SelectItem value="5">5 Passengers</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Search Button */}
          <div className="md:col-span-9">
            <Button className="w-full md:w-auto px-8" size="lg">
              <Search className="h-4 w-4 mr-2" />
              Search Buses
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

const meta = {
  title: "Components/SearchForm",
  component: SearchFormDemo,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "Bus search form with city selection, date picker, and passenger count.",
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof SearchFormDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: () => (
    <div className="w-full max-w-4xl p-6">
      <SearchFormDemo />
    </div>
  ),
};

export const OnHomepage: Story = {
  render: () => (
    <div className="min-h-screen bg-gradient-to-b from-primary/10 to-background">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center space-y-6 mb-12">
          <h1 className="text-4xl font-bold tracking-tight">
            Find Your Perfect Bus Journey
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Search and book comfortable, reliable bus tickets across India with ease.
          </p>
        </div>
        <div className="max-w-4xl mx-auto">
          <SearchFormDemo />
        </div>
      </div>
    </div>
  ),
};

export const Compact: Story = {
  render: () => (
    <div className="w-full max-w-2xl p-4 bg-card border rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Search Buses</h3>
      <div className="scale-90 origin-top-left">
        <SearchFormDemo />
      </div>
    </div>
  ),
};