'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FlittSetupWizard } from "./flitt-setup-wizard"
import { CreditCard } from "lucide-react"

export function FlittConfiguration() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <CreditCard className="h-6 w-6" />
          Flitt Payment კონფიგურაცია
        </h2>
        <p className="text-gray-600 mt-1">
          კონფიგურირება ავტომატური საბსქრიბშენების და გადახდების სისტემისთვის
        </p>
      </div>

      <FlittSetupWizard />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">როგორ მუშაობს ავტომატური საბსქრიბშენები?</CardTitle>
          <CardDescription>
            Flitt-ის ინტეგრაციით თქვენი კლიენტები ყოველთვიურად ავტომატურად იხდიან
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">კომპანიისთვის:</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• გადახდები პირდაპირ თქვენს ბანკის ანგარიშზე</li>
                <li>• ავტომატური ყოველთვიური ინვოისები</li>
                <li>• რეალურ დროში payments tracking</li>
                <li>• დეტალური analytics და reports</li>
                <li>• არ ღებულობთ გადახდების შესახებ</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">კლიენტისთვის:</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• ერთხელ რეგისტრაცია, მერე ყველაფერი ავტომატურად</li>
                <li>• Email verification-ით უსაფრთხო წვდომა</li>
                <li>• Public link საბსქრიბშენის მართვისთვის</li>
                <li>• შესაძლებლობა pause/cancel საკუთარ თავზე</li>
                <li>• ინვოისების და გადახდების ისტორია</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">უსაფრთხოება</CardTitle>
          <CardDescription>
            როგორ იცავს ჩვენი სისტემა თქვენს მონაცემებს
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div>
                <p className="font-medium">Encrypted Storage</p>
                <p className="text-sm text-gray-600">Secret Key-ები AES-256-GCM ალგორითმით იშიფრება</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div>
                <p className="font-medium">Multi-tenant იზოლაცია</p>
                <p className="text-sm text-gray-600">ყველა კომპანია თავის Merchant-ით იღებს გადახდებს</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div>
                <p className="font-medium">Webhook Verification</p>
                <p className="text-sm text-gray-600">ყველა incoming payment notification ვერიფიცირდება</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}