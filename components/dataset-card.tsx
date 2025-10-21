import Link from "next/link"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface Dataset {
  id: string
  title: string
  description: string
  price: number
  videoCount: number
  contributors: number
  category: string
  size: string
  tags: string[]
}

export function DatasetCard({ dataset }: { dataset: Dataset }) {
  return (
    <Card className="flex flex-col border-border/50 bg-card/50 backdrop-blur transition-all hover:border-primary/50">
      <CardHeader>
        <div className="mb-3 flex items-start justify-between gap-2">
          <Badge variant="secondary" className="text-xs">
            {dataset.category}
          </Badge>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">${dataset.price}</div>
            <div className="text-xs text-muted-foreground">one-time</div>
          </div>
        </div>
        <h3 className="text-balance text-xl font-semibold leading-tight">{dataset.title}</h3>
        <p className="mt-2 text-pretty text-sm text-muted-foreground leading-relaxed">{dataset.description}</p>
      </CardHeader>

      <CardContent className="flex-1">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Videos</span>
            <span className="font-medium">{dataset.videoCount.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Contributors</span>
            <span className="font-medium">{dataset.contributors.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Size</span>
            <span className="font-medium">{dataset.size}</span>
          </div>

          <div className="pt-2">
            <div className="flex flex-wrap gap-1.5">
              {dataset.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {dataset.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{dataset.tags.length - 3}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter>
        <Button asChild className="w-full">
          <Link href={`/marketplace/${dataset.id}`}>View Dataset</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
