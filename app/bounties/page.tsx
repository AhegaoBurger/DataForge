import { Navigation } from "@/components/navigation"
import { BountyCard } from "@/components/bounty-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Mock bounty data
const bounties = [
  {
    id: "1",
    title: "Kitchen Cleaning Tasks",
    description: "Record videos of various kitchen cleaning activities including wiping counters, washing dishes, and organizing cabinets.",
    reward: 2.5,
    videosNeeded: 500,
    videosSubmitted: 342,
    category: "Household",
    difficulty: "Easy",
    duration: "2-3 min",
    requirements: ["Clear lighting", "Stable camera", "Show full task"],
  },
  {
    id: "2",
    title: "Object Manipulation - Tools",
    description: "Demonstrate picking up, using, and placing down common tools like hammers, screwdrivers, and wrenches.",
    reward: 3.0,
    videosNeeded: 300,
    videosSubmitted: 156,
    category: "Manufacturing",
    difficulty: "Medium",
    duration: "3-5 min",
    requirements: ["Multiple angles", "Clear hand visibility", "Various tools"],
  },
  {
    id: "3",
    title: "Grocery Shopping Navigation",
    description: "Record your path through a grocery store, including selecting items, reading labels, and checkout process.",
    reward: 4.0,
    videosNeeded: 200,
    videosSubmitted: 89,
    category: "Retail",
    difficulty: "Medium",
    duration: "5-10 min",
    requirements: ["Store permission", "Face privacy", "Clear audio"],
  },
  {
    id: "4",
    title: "Folding Laundry",
    description: "Demonstrate folding various types of clothing items including shirts, pants, towels, and sheets.",
    reward: 2.0,
    videosNeeded: 400,
    videosSubmitted: 298,
    category: "Household",
    difficulty: "Easy",
    duration: "2-4 min",
    requirements: ["Clear hand movements", "Different clothing types", "Good lighting"],
  },
  {
    id: "5",
    title: "Door Opening Scenarios",
    description: "Record opening different types of doors: sliding, push, pull, automatic, with handles, knobs, etc.",
    reward: 1.5,
    videosNeeded: 600,
    videosSubmitted: 445,
    category: "Navigation",
    difficulty: "Easy",
    duration: "1-2 min",
    requirements: ["Various door types", "Clear mechanism visibility", "Multiple locations"],
  },
  {
    id: "6",
    title: "Food Preparation - Chopping",
    description: "Demonstrate chopping various vegetables and fruits with different cutting techniques and knife types.",
    reward: 3.5,
    videosNeeded: 250,
    videosSubmitted: 112,
    category: "Culinary",
    difficulty: "Hard",
    duration: "4-6 min",
    requirements: ["Safety precautions", "Multiple ingredients", "Clear hand/knife visibility"],
  },
]

export default function BountiesPage() {
  return (
    <div className="min-h-screen">
      <Navigation />

      <div className="container mx-auto px-4 pt-24 pb-16 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-balance text-4xl font-bold lg:text-5xl">Active Bounties</h1>
          <p className="mt-3 text-pretty text-muted-foreground lg:text-lg">
            Browse available data collection tasks and start earning cryptocurrency
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row">
          <Input placeholder="Search bounties..." className="sm:max-w-xs" />
          <Select>
            <SelectTrigger className="sm:w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="household">Household</SelectItem>
              <SelectItem value="manufacturing">Manufacturing</SelectItem>
              <SelectItem value="retail">Retail</SelectItem>
              <SelectItem value="navigation">Navigation</SelectItem>
              <SelectItem value="culinary">Culinary</SelectItem>
            </SelectContent>
          </Select>
          <Select>
            <SelectTrigger className="sm:w-[180px]">
              <SelectValue placeholder="Difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="easy">Easy</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="hard">Hard</SelectItem>
            </SelectContent>
          </Select>
          <Select>
            <SelectTrigger className="sm:w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="reward-high">Highest Reward</SelectItem>
              <SelectItem value="reward-low">Lowest Reward</SelectItem>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="popular">Most Popular</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Bounty Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {bounties.map((bounty) => (
            <BountyCard key={bounty.id} bounty={bounty} />
          ))}
        </div>
      </div>
    </div>
  )
}
