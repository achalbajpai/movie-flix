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
          <div className="text-sm text-muted-foreground mt-1">
            ${priceRange[0]} - ${priceRange[1]}
          </div>
        </div>
        <Slider
          value={priceRange}
          onValueChange={setPriceRange}
          min={0}
          max={1000}
          step={50}
          className="w-full"
        />
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
      </div>
    );
  },
};