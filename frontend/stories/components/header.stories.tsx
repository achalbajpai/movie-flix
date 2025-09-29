import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "../../components/ui/button";
import { Bus, Menu } from "lucide-react";

// Simplified Header component for Storybook that doesn't rely on Next.js
const HeaderDemo = () => {
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer">
            <Bus className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-foreground">BusGo</span>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm">
              Toggle Theme
            </Button>
            
            <Button size="lg" className="bg-white text-gray-700 border border-gray-300 hover:bg-gray-50">
              Sign In with Google
            </Button>

            <Button variant="ghost" size="sm" className="md:hidden">
              <Menu className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

const meta = {
  title: "Components/Header",
  component: HeaderDemo,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: "The main navigation header with branding, authentication, and theme toggle.",
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof HeaderDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: () => <HeaderDemo />,
};

export const LoggedOut: Story = {
  render: () => (
    <div className="min-h-screen bg-background">
      <HeaderDemo />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold">Page Content</h1>
        <p className="text-muted-foreground">
          This shows how the header looks when user is not logged in.
        </p>
      </div>
    </div>
  ),
};

export const Mobile: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  render: () => (
    <div className="min-h-screen bg-background">
      <HeaderDemo />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-xl font-bold">Mobile View</h1>
        <p className="text-sm text-muted-foreground">
          Header adapts to mobile screens with menu button.
        </p>
      </div>
    </div>
  ),
};