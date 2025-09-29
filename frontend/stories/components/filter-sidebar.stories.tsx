import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Card } from "../../components/ui/card";
import { Label } from "../../components/ui/label";
import { Checkbox } from "../../components/ui/checkbox";
import { Slider } from "../../components/ui/slider";
import { Button } from "../../components/ui/button";
import { Separator } from "../../components/ui/separator";
import { Badge } from "../../components/ui/badge";
import { X, Filter } from "lucide-react";
import { useState } from "react";

const mockFilters = {
  operators: [
    { name: "RedBus Express", count: 15 },
    { name: "VRL Travels", count: 8 },
    { name: "Orange Travels", count: 12 },
    { name: "SRS Travels", count: 6 },
    { name: "Kallada Travels", count: 10 }
  ],
  busTypes: [
    { name: "AC Sleeper", count: 25 },
    { name: "Non-AC Sleeper", count: 18 },
    { name: "AC Seater", count: 20 },
    { name: "Non-AC Seater", count: 12 }
  ],
  priceRange: { min: 400, max: 2500 },
  departureTimeSlots: [
    { slot: "Before 6 AM", count: 8 },
    { slot: "6 AM to 12 PM", count: 15 },
    { slot: "12 PM to 6 PM", count: 20 },
    { slot: "After 6 PM", count: 18 }
  ]
};

interface FilterSidebarProps {
  filters: typeof mockFilters | null;
  loading: boolean;
}

// Simplified FilterSidebar component for Storybook
const FilterSidebarDemo = ({ filters, loading }: FilterSidebarProps) => {
  const [priceRange, setPriceRange] = useState<[number, number]>([400, 2500]);
  const [selectedOperators, setSelectedOperators] = useState<string[]>([]);
  const [selectedBusTypes, setSelectedBusTypes] = useState<string[]>([]);
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<string[]>([]);

  if (loading) {
    return (
      <Card className="p-4 w-80">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-1/2"></div>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-4 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 w-80">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </h3>
          <Button variant="ghost" size="sm">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <Separator />

        {/* Price Range */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Price Range</Label>
          <div className="space-y-3">
            <Slider
              value={priceRange}
              onValueChange={(value) => setPriceRange(value as [number, number])}
              min={filters?.priceRange.min || 0}
              max={filters?.priceRange.max || 5000}
              step={50}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>₹{priceRange[0]}</span>
              <span>₹{priceRange[1]}</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Operators */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Bus Operators</Label>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {filters?.operators.map((operator) => (
              <div key={operator.name} className="flex items-center space-x-2">
                <Checkbox
                  id={operator.name}
                  checked={selectedOperators.includes(operator.name)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedOperators([...selectedOperators, operator.name]);
                    } else {
                      setSelectedOperators(selectedOperators.filter(op => op !== operator.name));
                    }
                  }}
                />
                <Label htmlFor={operator.name} className="text-sm flex-1 cursor-pointer">
                  {operator.name}
                  <span className="text-muted-foreground ml-1">({operator.count})</span>
                </Label>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Bus Types */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Bus Type</Label>
          <div className="space-y-2">
            {filters?.busTypes.map((busType) => (
              <div key={busType.name} className="flex items-center space-x-2">
                <Checkbox
                  id={busType.name}
                  checked={selectedBusTypes.includes(busType.name)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedBusTypes([...selectedBusTypes, busType.name]);
                    } else {
                      setSelectedBusTypes(selectedBusTypes.filter(bt => bt !== busType.name));
                    }
                  }}
                />
                <Label htmlFor={busType.name} className="text-sm flex-1 cursor-pointer">
                  {busType.name}
                  <span className="text-muted-foreground ml-1">({busType.count})</span>
                </Label>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Departure Time */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Departure Time</Label>
          <div className="space-y-2">
            {filters?.departureTimeSlots.map((timeSlot) => (
              <div key={timeSlot.slot} className="flex items-center space-x-2">
                <Checkbox
                  id={timeSlot.slot}
                  checked={selectedTimeSlots.includes(timeSlot.slot)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedTimeSlots([...selectedTimeSlots, timeSlot.slot]);
                    } else {
                      setSelectedTimeSlots(selectedTimeSlots.filter(ts => ts !== timeSlot.slot));
                    }
                  }}
                />
                <Label htmlFor={timeSlot.slot} className="text-sm flex-1 cursor-pointer">
                  {timeSlot.slot}
                  <span className="text-muted-foreground ml-1">({timeSlot.count})</span>
                </Label>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Applied Filters */}
        {(selectedOperators.length > 0 || selectedBusTypes.length > 0 || selectedTimeSlots.length > 0) && (
          <div className="space-y-3">
            <Label className="text-sm font-medium">Applied Filters</Label>
            <div className="flex flex-wrap gap-1">
              {[...selectedOperators, ...selectedBusTypes, ...selectedTimeSlots].map((filter) => (
                <Badge key={filter} variant="secondary" className="text-xs">
                  {filter}
                  <X className="h-3 w-3 ml-1" />
                </Badge>
              ))}
            </div>
            <Button variant="outline" size="sm" className="w-full">
              Clear All Filters
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};

const meta = {
  title: "Components/FilterSidebar",
  component: FilterSidebarDemo,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: "Sidebar component with filters for bus search results including price, operators, bus types, and timing.",
      },
    },
  },
  argTypes: {
    loading: {
      description: "Whether the filters are loading",
      control: { type: "boolean" },
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof FilterSidebarDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {
    filters: mockFilters,
    loading: false,
  },
  render: (args: FilterSidebarProps) => (
    <div className="w-80">
      <FilterSidebarDemo {...args} />
    </div>
  ),
};

export const Loading: Story = {
  args: {
    filters: null,
    loading: true,
  },
  render: (args: FilterSidebarProps) => (
    <div className="w-80">
      <FilterSidebarDemo {...args} />
    </div>
  ),
};

export const WithSearchResults: Story = {
  args: {
    filters: mockFilters,
    loading: false,
  },
  render: (args: FilterSidebarProps) => (
    <div className="flex gap-6 max-w-6xl">
      <div className="w-80 flex-shrink-0">
        <FilterSidebarDemo {...args} />
      </div>
      <div className="flex-1 space-y-4">
        <h2 className="text-xl font-semibold">Search Results</h2>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 border rounded-lg bg-card">
              <h3 className="font-medium">Bus Operator {i}</h3>
              <p className="text-sm text-muted-foreground">AC Sleeper • ₹1,200</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  ),
};