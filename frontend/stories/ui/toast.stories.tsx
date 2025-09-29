import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "../../components/ui/button";
import { useToast } from "../../hooks/use-toast";
import { Toaster } from "../../components/ui/toaster";
import { 
  CheckCircle, 
  AlertCircle, 
  Info, 
  X, 
  Calendar, 
  Mail 
} from "lucide-react";

const meta = {
  title: "Components/UI/Toast",
  component: Toaster,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "A succinct message that is displayed temporarily.",
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Toaster>;

export default meta;
type Story = StoryObj<typeof meta>;

const ToastDemo = ({ variant, title, description }: any) => {
  const { toast } = useToast();

  return (
    <div>
      <Button
        onClick={() => {
          toast({
            variant,
            title,
            description,
          });
        }}
      >
        Show Toast
      </Button>
      <Toaster />
    </div>
  );
};

export const Playground: Story = {
  render: () => (
    <ToastDemo
      title="Success"
      description="Your message has been sent."
    />
  ),
};

export const Variants: Story = {
  render: () => {
    const { toast } = useToast();

    return (
      <div className="flex gap-2 flex-wrap">
        <Button
          onClick={() => {
            toast({
              title: "Success",
              description: "Your action was completed successfully.",
            });
          }}
        >
          Default
        </Button>
        <Button
          variant="destructive"
          onClick={() => {
            toast({
              variant: "destructive",
              title: "Error",
              description: "Something went wrong. Please try again.",
            });
          }}
        >
          Destructive
        </Button>
        <Toaster />
      </div>
    );
  },
};

export const WithAction: Story = {
  render: () => {
    const { toast } = useToast();

    return (
      <div>
        <Button
          onClick={() => {
            toast({
              title: "Scheduled: Catch up",
              description: "Friday, February 10, 2023 at 5:57 PM",
              action: (
                <Button size="sm" variant="outline">
                  Undo
                </Button>
              ),
            });
          }}
        >
          Show Toast with Action
        </Button>
        <Toaster />
      </div>
    );
  },
};