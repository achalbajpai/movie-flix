import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Slider } from "../../components/ui/slider";
import { Label } from "../../components/ui/label";

const meta = {
  title: "Components/UI/Slider",
  component: Slider,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "An input where the user selects a value from within a given range.",
      },
    },
  },
  argTypes: {
    defaultValue: {
      description: "The value of the slider when initially rendered.",
      control: { type: "object" },
    },
    min: {
      description: "The minimum value for the range.",
      control: { type: "number" },
    },
    max: {
      description: "The maximum value for the range.",
      control: { type: "number" },
    },
    step: {
      description: "The stepping interval.",
      control: { type: "number" },
    },
    disabled: {
      description: "When true, prevents the user from interacting with the slider.",
      control: { type: "boolean" },
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Slider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {
    defaultValue: [50],
    min: 0,
    max: 100,
    step: 1,
  },
  render: (args) => (
    <div className="w-80 space-y-4">
      <Label className="text-sm font-medium">Volume</Label>
      <Slider {...args} />
      <div className="text-sm text-muted-foreground">
        Adjust the volume level
      </div>
    </div>
  ),
};

export const RangeSlider: Story = {
  render: () => {
    const [priceRange, setPriceRange] = useState([200, 800]);

    return (
      <div className="w-80 space-y-4">
        <div>
          <Label className="text-sm font-medium">Price Range</Label>
          <div className="flex justify-between text-sm text-muted-foreground mt-1">
            <span>₹{priceRange[0]}</span>
            <span>₹{priceRange[1]}</span>
          </div>
        </div>
        <Slider
          value={priceRange}
          onValueChange={setPriceRange}
          min={200}
          max={1000}
          step={50}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>₹200</span>
          <span>₹1000</span>
        </div>
      </div>
    );
  },
};

export const SingleValue: Story = {
  render: () => {
    const [rating, setRating] = useState([3]);

    return (
      <div className="w-80 space-y-4">
        <div>
          <Label className="text-sm font-medium">Minimum Rating</Label>
          <div className="text-sm text-muted-foreground mt-1">
            ⭐ {rating[0]} and above
          </div>
        </div>
        <Slider
          value={rating}
          onValueChange={setRating}
          min={1}
          max={5}
          step={0.5}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>1.0</span>
          <span>5.0</span>
        </div>
      </div>
    );
  },
};

export const TravelTimeRange: Story = {
  render: () => {
    const [timeRange, setTimeRange] = useState([6, 22]);

    const formatTime = (hour: number) => {
      if (hour === 0) return "12:00 AM";
      if (hour < 12) return `${hour}:00 AM`;
      if (hour === 12) return "12:00 PM";
      return `${hour - 12}:00 PM`;
    };

    return (
      <div className="w-80 space-y-4">
        <div>
          <Label className="text-sm font-medium">Departure Time Range</Label>
          <div className="flex justify-between text-sm text-muted-foreground mt-1">
            <span>{formatTime(timeRange[0])}</span>
            <span>{formatTime(timeRange[1])}</span>
          </div>
        </div>
        <Slider
          value={timeRange}
          onValueChange={setTimeRange}
          min={0}
          max={23}
          step={1}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>12:00 AM</span>
          <span>11:00 PM</span>
        </div>
      </div>
    );
  },
};

export const JourneyDuration: Story = {
  render: () => {
    const [duration, setDuration] = useState([12]);

    return (
      <div className="w-80 space-y-4">
        <div>
          <Label className="text-sm font-medium">Maximum Journey Duration</Label>
          <div className="text-sm text-muted-foreground mt-1">
            {duration[0]} hours
          </div>
        </div>
        <Slider
          value={duration}
          onValueChange={setDuration}
          min={4}
          max={24}
          step={2}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>4h</span>
          <span>24h</span>
        </div>
      </div>
    );
  },
};

export const FilterSliders: Story = {
  render: () => {
    const [priceRange, setPriceRange] = useState([500, 2000]);
    const [rating, setRating] = useState([3.5]);
    const [timeRange, setTimeRange] = useState([6, 22]);

    const formatTime = (hour: number) => {
      if (hour === 0) return "12:00 AM";
      if (hour < 12) return `${hour}:00 AM`;
      if (hour === 12) return "12:00 PM";
      return `${hour - 12}:00 PM`;
    };

    return (
      <div className="w-80 space-y-8 p-4 border rounded-lg">
        <h3 className="font-medium">Filter Options</h3>

        <div className="space-y-3">
          <div>
            <Label className="text-sm font-medium">Price Range</Label>
            <div className="flex justify-between text-sm text-muted-foreground mt-1">
              <span>₹{priceRange[0]}</span>
              <span>₹{priceRange[1]}</span>
            </div>
          </div>
          <Slider
            value={priceRange}
            onValueChange={setPriceRange}
            min={200}
            max={5000}
            step={100}
            className="w-full"
          />
        </div>

        <div className="space-y-3">
          <div>
            <Label className="text-sm font-medium">Minimum Rating</Label>
            <div className="text-sm text-muted-foreground mt-1">
              ⭐ {rating[0]} and above
            </div>
          </div>
          <Slider
            value={rating}
            onValueChange={setRating}
            min={1}
            max={5}
            step={0.5}
            className="w-full"
          />
        </div>

        <div className="space-y-3">
          <div>
            <Label className="text-sm font-medium">Departure Time</Label>
            <div className="flex justify-between text-sm text-muted-foreground mt-1">
              <span>{formatTime(timeRange[0])}</span>
              <span>{formatTime(timeRange[1])}</span>
            </div>
          </div>
          <Slider
            value={timeRange}
            onValueChange={setTimeRange}
            min={0}
            max={23}
            step={1}
            className="w-full"
          />
        </div>
      </div>
    );
  },
};