import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { ArrowLeftRight, Calendar, MapPin, Edit } from "lucide-react";
import { useState } from "react";

// Simplified SearchSummary component for Storybook
const SearchSummaryDemo = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [searchData, setSearchData] = useState({
    from: "Delhi",
    to: "Mumbai", 
    date: "2024-03-15",
    passengers: "2"
  });

  if (isEditing) {
    return (
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">From</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchData.from}
                onChange={(e) => setSearchData({...searchData, from: e.target.value})}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">To</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchData.to}
                onChange={(e) => setSearchData({...searchData, to: e.target.value})}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                value={searchData.date}
                onChange={(e) => setSearchData({...searchData, date: e.target.value})}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Passengers</label>
            <Select value={searchData.passengers} onValueChange={(value) => setSearchData({...searchData, passengers: value})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 Passenger</SelectItem>
                <SelectItem value="2">2 Passengers</SelectItem>
                <SelectItem value="3">3 Passengers</SelectItem>
                <SelectItem value="4">4 Passengers</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button onClick={() => setIsEditing(false)}>Update</Button>
            <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{searchData.from}</span>
            <ArrowLeftRight className="h-3 w-3 text-muted-foreground" />
            <span className="font-medium">{searchData.to}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{new Date(searchData.date).toLocaleDateString()}</span>
          </div>
          
          <div className="text-muted-foreground">
            {searchData.passengers} {searchData.passengers === "1" ? "Passenger" : "Passengers"}
          </div>
        </div>

        <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
          <Edit className="h-4 w-4 mr-2" />
          Modify Search
        </Button>
      </div>
    </Card>
  );
};

const meta = {
  title: "Components/SearchSummary",
  component: SearchSummaryDemo,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "A compact summary of the current search parameters with an option to modify them.",
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof SearchSummaryDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: () => <SearchSummaryDemo />,
};

export const WithResults: Story = {
  render: () => (
    <div className="space-y-6">
      <SearchSummaryDemo />
      <div className="grid gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Available Buses</h2>
          <span className="text-sm text-muted-foreground">25 buses found</span>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 border rounded-lg bg-card">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium">Express Bus {i}</h3>
                  <p className="text-sm text-muted-foreground">AC Sleeper</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">₹1,{200 + i * 50}</p>
                  <p className="text-sm text-muted-foreground">per seat</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  ),
};

export const Compact: Story = {
  render: () => (
    <div className="max-w-2xl">
      <SearchSummaryDemo />
    </div>
  ),
};