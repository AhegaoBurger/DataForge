import Link from "next/link";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface Bounty {
  id: string;
  creator_id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  reward_amount: number;
  reward_token: string;
  total_slots: number;
  filled_slots: number;
  requirements: string[];
  guidelines: string | null;
  example_video_url: string | null;
  status: string;
  deadline: string | null;
  created_at: string;
  updated_at: string;
  profiles?: {
    display_name: string;
    avatar_url: string | null;
  };
}

export function BountyCard({ bounty }: { bounty: Bounty }) {
  const progress = (bounty.filled_slots / bounty.total_slots) * 100;

  return (
    <Card className="flex flex-col border-border/50 bg-card/50 backdrop-blur transition-all hover:border-primary/50">
      <CardHeader>
        <div className="mb-3 flex items-start justify-between gap-2">
          <Badge variant="secondary" className="text-xs">
            {bounty.category}
          </Badge>
          <Badge
            variant="outline"
            className={
              bounty.difficulty === "easy"
                ? "border-secondary/50 text-secondary"
                : bounty.difficulty === "medium"
                  ? "border-primary/50 text-primary"
                  : "border-destructive/50 text-destructive"
            }
          >
            {bounty.difficulty.charAt(0).toUpperCase() +
              bounty.difficulty.slice(1)}
          </Badge>
        </div>
        <h3 className="text-balance text-xl font-semibold leading-tight">
          {bounty.title}
        </h3>
        <p className="mt-2 text-pretty text-sm text-muted-foreground leading-relaxed">
          {bounty.description}
        </p>
      </CardHeader>

      <CardContent className="flex-1">
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">
              {bounty.filled_slots} / {bounty.total_slots}
            </span>
          </div>
          <Progress value={progress} className="h-2" />

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {bounty.deadline
                ? new Date(bounty.deadline).toLocaleDateString()
                : "No deadline"}
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">
                {bounty.reward_amount} {bounty.reward_token}
              </div>
              <div className="text-xs text-muted-foreground">total reward</div>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter>
        <Button asChild className="w-full">
          <Link href={`/bounties/${bounty.id}`}>View Details</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
