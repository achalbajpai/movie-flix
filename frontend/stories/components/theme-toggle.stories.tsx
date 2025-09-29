import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "../../components/ui/button";
import { Moon, Sun, Monitor } from "lucide-react";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";

// Simplified ThemeToggle component for Storybook
const ThemeToggleDemo = () => {
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");

  const handleThemeChange = (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleThemeChange("light")}>
          <Sun className="mr-2 h-4 w-4" />
          <span>Light</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleThemeChange("dark")}>
          <Moon className="mr-2 h-4 w-4" />
          <span>Dark</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleThemeChange("system")}>
          <Monitor className="mr-2 h-4 w-4" />
          <span>System</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const meta = {
  title: "Components/ThemeToggle",
  component: ThemeToggleDemo,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "A toggle button for switching between light, dark, and system themes.",
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof ThemeToggleDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: () => <ThemeToggleDemo />,
};

export const Default: Story = {
  render: () => (
    <div className="p-4">
      <ThemeToggleDemo />
    </div>
  ),
};

export const InNavigation: Story = {
  render: () => (
    <nav className="flex items-center justify-between p-4 border-b">
      <h1 className="text-lg font-semibold">BusBooking</h1>
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground">Settings</span>
        <ThemeToggleDemo />
      </div>
    </nav>
  ),
};