import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { User, Building, CreditCard, Bell } from "lucide-react"

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">პარამეტრები</h1>
        <p className="text-gray-600">მართეთ თქვენი ანგარიშის პარამეტრები</p>
      </div>

      <div className="grid gap-6">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5" />
              <CardTitle>პროფილის პარამეტრები</CardTitle>
            </div>
            <CardDescription>
              განაახლეთ თქვენი პერსონალური ინფორმაცია
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="fullName">სრული სახელი</Label>
              <Input id="fullName" placeholder="ჩაწერეთ თქვენი სახელი" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">ელ.ფოსტა</Label>
              <Input id="email" type="email" placeholder="your@email.com" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">ტელეფონი</Label>
              <Input id="phone" placeholder="+995 555 123 456" />
            </div>
            <Button>შენახვა</Button>
          </CardContent>
        </Card>

        {/* Company Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              <CardTitle>კომპანიის პარამეტრები</CardTitle>
            </div>
            <CardDescription>
              განაახლეთ თქვენი კომპანიის ინფორმაცია
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="companyName">კომპანიის დასახელება</Label>
              <Input id="companyName" placeholder="შპს Example" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="taxId">საიდენტიფიკაციო კოდი</Label>
              <Input id="taxId" placeholder="123456789" />
            </div>
            <Button>შენახვა</Button>
          </CardContent>
        </Card>

        {/* Billing Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              <CardTitle>ბილინგი</CardTitle>
            </div>
            <CardDescription>
              მართეთ თქვენი გადახდები და გეგმა
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">მიმდინარე გეგმა</p>
                <p className="text-sm text-gray-600">Free Plan - 5 კრედიტი</p>
              </div>
              <Button variant="outline">განახლება</Button>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              <CardTitle>შეტყობინებები</CardTitle>
            </div>
            <CardDescription>
              კონფიგურაცია შეტყობინებების შესახებ
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                შეტყობინებების პარამეტრები ხელმისაწვდომი იქნება მალე
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}