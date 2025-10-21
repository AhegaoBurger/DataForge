import { Navigation } from "@/components/navigation"
import { DatasetCard } from "@/components/dataset-card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Mock dataset data
const datasets = [
  {
    id: "1",
    title: "Kitchen Cleaning Activities Dataset",
    description: "500+ videos of diverse kitchen cleaning tasks from 200+ contributors across 15 countries.",
    price: 1250,
    videoCount: 542,
    contributors: 218,
    category: "Household",
    format: "MP4, JSON metadata",
    size: "45 GB",
    license: "Commercial Use",
    tags: ["cleaning", "kitchen", "household", "manipulation"],
  },
  {
    id: "2",
    title: "Tool Manipulation Dataset",
    description: "High-quality videos of hand-tool interactions including grasping, using, and placing various tools.",
    price: 900,
    videoCount: 312,
    contributors: 156,
    category: "Manufacturing",
    format: "MP4, JSON metadata",
    size: "28 GB",
    license: "Commercial Use",
    tags: ["tools", "manipulation", "grasping", "manufacturing"],
  },
  {
    id: "3",
    title: "Retail Navigation Dataset",
    description: "First-person perspective videos of shopping experiences in various retail environments.",
    price: 1600,
    videoCount: 189,
    contributors: 89,
    category: "Retail",
    format: "MP4, JSON metadata",
    size: "67 GB",
    license: "Commercial Use",
    tags: ["navigation", "retail", "shopping", "indoor"],
  },
  {
    id: "4",
    title: "Laundry Folding Dataset",
    description: "Comprehensive collection of clothing folding techniques across different garment types.",
    price: 800,
    videoCount: 398,
    contributors: 167,
    category: "Household",
    format: "MP4, JSON metadata",
    size: "32 GB",
    license: "Commercial Use",
    tags: ["folding", "laundry", "clothing", "manipulation"],
  },
  {
    id: "5",
    title: "Door Interaction Dataset",
    description: "Diverse door opening scenarios covering multiple door types, mechanisms, and environments.",
    price: 600,
    videoCount: 645,
    contributors: 234,
    category: "Navigation",
    format: "MP4, JSON metadata",
    size: "38 GB",
    license: "Commercial Use",
    tags: ["doors", "navigation", "interaction", "indoor"],
  },
  {
    id: "6",
    title: "Food Preparation - Cutting Dataset",
    description: "Professional-quality videos of food cutting techniques with various ingredients and tools.",
    price: 1100,
    videoCount: 256,
    contributors: 112,
    category: "Culinary",
    format: "MP4, JSON metadata",
    size: "41 GB",
    license: "Commercial Use",
    tags: ["cooking", "cutting", "food", "culinary"],
  },
]

export default function MarketplacePage() {
  return (
    <div className="min-h-screen">
      <Navigation />

      <div className="container mx-auto px-4 pt-24 pb-16 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-balance text-4xl font-bold lg:text-5xl">Dataset Marketplace</h1>
          <p className="mt-3 text-pretty text-muted-foreground lg:text-lg">
            Purchase high-quality, diverse training datasets for your robotics and AI projects
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row">
          <Input placeholder="Search datasets..." className="sm:max-w-xs" />
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
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="price-high">Highest Price</SelectItem>
              <SelectItem value="price-low">Lowest Price</SelectItem>
              <SelectItem value="videos-high">Most Videos</SelectItem>
              <SelectItem value="newest">Newest</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Dataset Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {datasets.map((dataset) => (
            <DatasetCard key={dataset.id} dataset={dataset} />
          ))}
        </div>
      </div>
    </div>
  )
}
