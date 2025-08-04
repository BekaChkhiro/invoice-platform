import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, FileText, Search } from "lucide-react"
import { Input } from "@/components/ui/input"

export default function InvoicesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">ინვოისები</h1>
          <p className="text-gray-600">მართეთ თქვენი ინვოისები</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          ახალი ინვოისი
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="ძებნა ინვოისებში..."
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mb-4" />
            <CardTitle className="text-xl mb-2">არ გაქვთ ინვოისები</CardTitle>
            <CardDescription className="text-center mb-4">
              დაიწყეთ თქვენი პირველი ინვოისის შექმნით
            </CardDescription>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              შექმნა
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}