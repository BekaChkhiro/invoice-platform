import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export default function DesignTestPage() {
  return (
    <div className="container mx-auto p-8 space-y-12">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold">დიზაინ სისტემის ტესტი</h1>
        <p className="text-muted-foreground">Invoice Platform Design System</p>
      </div>
      
      {/* Color Palette */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">ფერების პალიტრა</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">Primary</h3>
            <div className="space-y-2">
              <div className="h-16 bg-primary-50 rounded-lg border flex items-center justify-center text-xs">50</div>
              <div className="h-16 bg-primary-100 rounded-lg border flex items-center justify-center text-xs">100</div>
              <div className="h-16 bg-primary-500 rounded-lg flex items-center justify-center text-xs text-white font-medium">500</div>
              <div className="h-16 bg-primary-900 rounded-lg flex items-center justify-center text-xs text-white font-medium">900</div>
            </div>
          </div>
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">Success</h3>
            <div className="space-y-2">
              <div className="h-16 bg-success-50 rounded-lg border flex items-center justify-center text-xs">50</div>
              <div className="h-16 bg-success-100 rounded-lg border flex items-center justify-center text-xs">100</div>
              <div className="h-16 bg-success-500 rounded-lg flex items-center justify-center text-xs text-white font-medium">500</div>
              <div className="h-16 bg-success-900 rounded-lg flex items-center justify-center text-xs text-white font-medium">900</div>
            </div>
          </div>
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">Warning</h3>
            <div className="space-y-2">
              <div className="h-16 bg-warning-50 rounded-lg border flex items-center justify-center text-xs">50</div>
              <div className="h-16 bg-warning-100 rounded-lg border flex items-center justify-center text-xs">100</div>
              <div className="h-16 bg-warning-500 rounded-lg flex items-center justify-center text-xs text-white font-medium">500</div>
              <div className="h-16 bg-warning-900 rounded-lg flex items-center justify-center text-xs text-white font-medium">900</div>
            </div>
          </div>
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">Error</h3>
            <div className="space-y-2">
              <div className="h-16 bg-error-50 rounded-lg border flex items-center justify-center text-xs">50</div>
              <div className="h-16 bg-error-100 rounded-lg border flex items-center justify-center text-xs">100</div>
              <div className="h-16 bg-error-500 rounded-lg flex items-center justify-center text-xs text-white font-medium">500</div>
              <div className="h-16 bg-error-900 rounded-lg flex items-center justify-center text-xs text-white font-medium">900</div>
            </div>
          </div>
        </div>
      </section>

      {/* Typography */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">ტიპოგრაფია</h2>
        <div className="space-y-4">
          <h1 className="text-4xl font-bold">Heading 1 - 4xl Bold</h1>
          <h2 className="text-3xl font-semibold">Heading 2 - 3xl Semibold</h2>
          <h3 className="text-2xl font-semibold">Heading 3 - 2xl Semibold</h3>
          <h4 className="text-xl font-semibold">Heading 4 - xl Semibold</h4>
          <p className="text-base">Body text - Base (16px) Regular</p>
          <p className="text-sm text-muted-foreground">Small text - SM (14px) Muted</p>
          <p className="text-xs text-muted-foreground">Extra small - XS (12px) Muted</p>
        </div>
      </section>

      {/* Buttons */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">ღილაკები</h2>
        <div className="space-y-4">
          <div className="flex gap-4 flex-wrap items-center">
            <Button>Primary Button</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
          </div>
          <div className="flex gap-4 flex-wrap items-center">
            <Button size="sm">Small</Button>
            <Button size="default">Default</Button>
            <Button size="lg">Large</Button>
          </div>
          <div className="flex gap-4 flex-wrap items-center">
            <Button disabled>Disabled</Button>
            <Button variant="outline" disabled>Disabled Outline</Button>
          </div>
        </div>
      </section>

      {/* Input Fields */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">Input ველები</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="default">Default Input</Label>
              <Input id="default" placeholder="Enter text..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="error">Error State</Label>
              <Input id="error" placeholder="Invalid input" className="border-error-500 focus:ring-error-500" />
              <p className="text-xs text-error-600">This field is required</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="disabled">Disabled Input</Label>
              <Input id="disabled" placeholder="Disabled" disabled />
            </div>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="textarea">Textarea</Label>
              <Textarea id="textarea" placeholder="Enter longer text..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="success">Success State</Label>
              <Input id="success" placeholder="Valid input" className="border-success-500 focus:ring-success-500" />
              <p className="text-xs text-success-600">Looks good!</p>
            </div>
          </div>
        </div>
      </section>

      {/* Cards and Shadows */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">Cards და Shadows</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Default Card</CardTitle>
              <CardDescription>Basic card with default styling</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                This is a standard card component with header and content sections.
              </p>
            </CardContent>
          </Card>
          
          <Card className="card-hover">
            <CardHeader>
              <CardTitle>Hover Card</CardTitle>
              <CardDescription>Card with hover effects</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                This card has hover animations and shadow effects.
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-primary-200 bg-primary-50">
            <CardHeader>
              <CardTitle className="text-primary-800">Colored Card</CardTitle>
              <CardDescription className="text-primary-600">Card with primary colors</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-primary-700">
                This card demonstrates color theming.
              </p>
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Shadow Variants</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="h-24 bg-white rounded-lg shadow-sm border flex items-center justify-center">
              <span className="text-xs font-medium">Shadow SM</span>
            </div>
            <div className="h-24 bg-white rounded-lg shadow-md flex items-center justify-center">
              <span className="text-xs font-medium">Shadow MD</span>
            </div>
            <div className="h-24 bg-white rounded-lg shadow-lg flex items-center justify-center">
              <span className="text-xs font-medium">Shadow LG</span>
            </div>
            <div className="h-24 bg-white rounded-lg shadow-xl flex items-center justify-center">
              <span className="text-xs font-medium">Shadow XL</span>
            </div>
          </div>
        </div>
      </section>

      {/* Status Badges */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">Status Badges</h2>
        <div className="space-y-4">
          <div className="flex gap-4 flex-wrap items-center">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="destructive">Destructive</Badge>
          </div>
          
          <div className="flex gap-4 flex-wrap items-center">
            <Badge className="badge-success">Success</Badge>
            <Badge className="badge-warning">Warning</Badge>
            <Badge className="badge-error">Error</Badge>
          </div>

          <div className="space-y-2">
            <h3 className="text-base font-medium">Invoice Status Examples</h3>
            <div className="flex gap-3 flex-wrap">
              <Badge className="bg-success-100 text-success-800 border-success-200">გადახდილი</Badge>
              <Badge className="bg-warning-100 text-warning-800 border-warning-200">მოლოდინში</Badge>
              <Badge className="bg-error-100 text-error-800 border-error-200">გაუქმებული</Badge>
              <Badge className="bg-gray-100 text-gray-800 border-gray-200">ნახელნახი</Badge>
              <Badge className="bg-primary-100 text-primary-800 border-primary-200">გაგზავნილი</Badge>
            </div>
          </div>
        </div>
      </section>

      {/* Spacing and Layout */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">Spacing და Layout</h2>
        <div className="space-y-4">
          <h3 className="text-base font-medium">Spacing Scale (4px base)</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-4">
              <div className="w-1 h-4 bg-primary-500"></div>
              <span className="text-sm">1 = 4px</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-2 h-4 bg-primary-500"></div>
              <span className="text-sm">2 = 8px</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-4 h-4 bg-primary-500"></div>
              <span className="text-sm">4 = 16px</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-8 h-4 bg-primary-500"></div>
              <span className="text-sm">8 = 32px</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-16 h-4 bg-primary-500"></div>
              <span className="text-sm">16 = 64px</span>
            </div>
          </div>
        </div>
      </section>

      {/* Border Radius */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">Border Radius</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="h-20 bg-primary-100 rounded-sm border-2 border-primary-300 flex items-center justify-center">
            <span className="text-xs font-medium">SM (4px)</span>
          </div>
          <div className="h-20 bg-primary-100 rounded-md border-2 border-primary-300 flex items-center justify-center">
            <span className="text-xs font-medium">MD (6px)</span>
          </div>
          <div className="h-20 bg-primary-100 rounded-lg border-2 border-primary-300 flex items-center justify-center">
            <span className="text-xs font-medium">LG (8px)</span>
          </div>
          <div className="h-20 bg-primary-100 rounded-xl border-2 border-primary-300 flex items-center justify-center">
            <span className="text-xs font-medium">XL (12px)</span>
          </div>
        </div>
      </section>
    </div>
  )
}