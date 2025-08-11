"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from "@/components/ui/breadcrumb"
import { CheckCircle } from "lucide-react"

export default function BillingSettingsPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">მთავარი</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard/settings">პარამეტრები</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>ბილინგი</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold">ბილინგი და გამოწერა</h1>
        <p className="text-muted-foreground mt-1">
          თქვენი გეგმის და გამოყენების ინფორმაცია
        </p>
      </div>

      <Separator />

      {/* Unlimited Access Card */}
      <Card>
        <CardHeader>
          <CardTitle>შეუზღუდავი წვდომა</CardTitle>
          <CardDescription>
            ყველა ფუნქცია ხელმისაწვდომია
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              თქვენ გაქვთ წვდომა პლატფორმის ყველა ფუნქციაზე შეზღუდვის გარეშე.
            </AlertDescription>
          </Alert>

          <div className="grid gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">ინვოისების ლიმიტი</span>
              <span className="text-sm font-medium text-green-600">შეუზღუდავი</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">კლიენტების ლიმიტი</span>
              <span className="text-sm font-medium text-green-600">შეუზღუდავი</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">PDF ექსპორტი</span>
              <span className="text-sm font-medium text-green-600">✓ ხელმისაწვდომია</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">ელ.ფოსტის გაგზავნა</span>
              <span className="text-sm font-medium text-green-600">✓ ხელმისაწვდომია</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">API წვდომა</span>
              <span className="text-sm font-medium text-green-600">✓ ხელმისაწვდომია</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">გუნდის წევრები</span>
              <span className="text-sm font-medium text-green-600">✓ ხელმისაწვდომია</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Advanced Analytics</span>
              <span className="text-sm font-medium text-green-600">✓ ხელმისაწვდომია</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Custom Branding</span>
              <span className="text-sm font-medium text-green-600">✓ ხელმისაწვდომია</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Features Overview */}
      <Card>
        <CardHeader>
          <CardTitle>ხელმისაწვდომი ფუნქციები</CardTitle>
          <CardDescription>
            ყველა ფუნქცია, რომელიც შეგიძლიათ გამოიყენოთ
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">ძირითადი ფუნქციები</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• შეუზღუდავი ინვოისების შექმნა</li>
                <li>• შეუზღუდავი კლიენტების დამატება</li>
                <li>• მრავალვალუტიანი მხარდაჭერა</li>
                <li>• ავტომატური გადასახადების გამოთვლა</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-sm">დამატებითი ფუნქციები</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• PDF და Excel ექსპორტი</li>
                <li>• ელ.ფოსტით გაგზავნა</li>
                <li>• რეკურენტული ინვოისები</li>
                <li>• API ინტეგრაცია</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-sm">ანალიტიკა</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• დეტალური რეპორტები</li>
                <li>• შემოსავლების ანალიზი</li>
                <li>• კლიენტების სტატისტიკა</li>
                <li>• ექსპორტი და ჩამოტვირთვა</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-sm">გუნდი და თანამშრომლობა</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• გუნდის წევრების მოწვევა</li>
                <li>• როლებზე დაფუძნებული წვდომა</li>
                <li>• აქტივობის ისტორია</li>
                <li>• კომენტარები და შენიშვნები</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}