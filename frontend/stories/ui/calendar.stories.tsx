import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Calendar } from "../../components/ui/calendar";
import { useState } from "react";

const meta = {
  title: "Components/UI/Calendar",
  component: Calendar,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "A date field component that allows users to enter and edit date.",
      },
    },
  },
  argTypes: {
    mode: {
      description: "The selection mode of the calendar.",
      control: { type: "select" },
      options: ["single", "multiple", "range"],
    },
    disabled: {
      description: "Whether the calendar is disabled.",
      control: { type: "boolean" },
    },
    showOutsideDays: {
      description: "Whether to show days outside the current month.",
      control: { type: "boolean" },
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Calendar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: () => {
    const [date, setDate] = useState<Date | undefined>(new Date());

    return (
      <Calendar
        mode="single"
        selected={date}
        onSelect={setDate}
        className="rounded-md border"
      />
    );
  },
};

export const MultipleSelection: Story = {
  render: () => {
    const [dates, setDates] = useState<Date[] | undefined>([]);

    return (
      <Calendar
        mode="multiple"
        selected={dates}
        onSelect={setDates}
        className="rounded-md border"
      />
    );
  },
};

export const RangeSelection: Story = {
  render: () => {
    const [dateRange, setDateRange] = useState<{from?: Date; to?: Date} | undefined>();

    return (
      <Calendar
        mode="range"
        selected={dateRange as any}
        onSelect={setDateRange as any}
        className="rounded-md border"
      />
    );
  },
};