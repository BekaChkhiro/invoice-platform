import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { CheckCircle, FileText, Users, TrendingUp, Clock, Shield, Zap, Star, ArrowRight, Sparkles } from "lucide-react"
import LandingHeader from "@/components/layout/landing-header"
import PWAInstallButton from "@/components/ui/pwa-install-button"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <LandingHeader />

      {/* Hero Section */}
      <section className="relative bg-white mx-4 my-8 rounded-2xl shadow-sm border border-gray-200">
        <div className="container space-y-8 pb-8 pt-12 md:pb-12 md:pt-20 lg:py-40">
          <div className="relative mx-auto flex max-w-[68rem] flex-col items-center gap-6 text-center">
            <Badge variant="outline" className="text-sm px-4 py-1 bg-sky-50 text-sky-700 border-sky-200">
              <Sparkles className="mr-2 h-3 w-3" />
              ქართული ბიზნესებისთვის
            </Badge>
            <h1 className="font-bold text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl tracking-tight text-gray-900">
              ინვოისების მართვა
              <br className="hidden sm:inline" />
              <span className="text-primary">მარტივად</span>
            </h1>
            <p className="max-w-[42rem] leading-relaxed text-muted-foreground sm:text-xl sm:leading-8 text-lg">
              შექმენით, გააგზავნეთ და მართეთ ინვოისები პროფესიონალურად. 
              მარტივი ინტერფეისი, ძლიერი ფუნქციონალობა, ყველაფერი რაც თქვენს ბიზნესს სჭირდება.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <Link href="/register">
                <Button size="lg" className="h-12 px-8 text-base font-semibold bg-primary hover:bg-primary/90 text-white shadow-sm hover:shadow-md transition-all duration-200">
                  <Zap className="mr-2 h-5 w-5" />
                  დაიწყეთ უფასოდ
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="lg" className="h-12 px-8 text-base font-semibold border-gray-300 text-gray-700 hover:bg-gray-50 transition-all duration-200">
                  შესვლა
                </Button>
              </Link>
            </div>
            
            <div className="mt-6">
              <PWAInstallButton 
                variant="secondary" 
                size="lg" 
                className="h-10 px-6 text-sm font-medium bg-green-50 hover:bg-green-100 text-green-700 border border-green-200"
              >
                📱 აპლიკაციად ინსტალაცია
              </PWAInstallButton>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-white mx-4 my-8 rounded-2xl shadow-sm border border-gray-200">
        <div className="container mx-auto px-4 py-16 md:py-20 lg:py-32">
          <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-6 text-center mb-16">
            <Badge className="px-4 py-1 bg-sky-50 text-sky-700 border-sky-200">ფუნქციები</Badge>
            <h2 className="font-bold text-3xl leading-tight sm:text-4xl md:text-5xl lg:text-6xl text-gray-900">
              ყველაფერი რაც გჭირდებათ
            </h2>
            <p className="max-w-[85%] leading-relaxed text-gray-600 sm:text-lg sm:leading-8">
              სრული ფუნქციონალობა ინვოისების მართვისთვის ერთ ადგილას
            </p>
          </div>
          
          <div className="mx-auto grid justify-center gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl">
            <Card className="relative group hover:shadow-lg transition-all duration-300 border border-gray-200 bg-white">
              <CardHeader className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-100 group-hover:bg-primary group-hover:text-white transition-colors">
                    <FileText className="h-6 w-6 text-sky-600 group-hover:text-white" />
                  </div>
                </div>
                <CardTitle className="text-xl font-semibold text-gray-900">ინვოისების შექმნა</CardTitle>
                <CardDescription className="text-base leading-relaxed text-gray-600">
                  მარტივი და სწრაფი ინვოისების შექმნა პროფესიონალური დიზაინით.
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="relative group hover:shadow-lg transition-all duration-300 border border-gray-200 bg-white">
              <CardHeader className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-100 group-hover:bg-primary group-hover:text-white transition-colors">
                    <Users className="h-6 w-6 text-sky-600 group-hover:text-white" />
                  </div>
                </div>
                <CardTitle className="text-xl font-semibold text-gray-900">კლიენტების მართვა</CardTitle>
                <CardDescription className="text-base leading-relaxed text-gray-600">
                  კლიენტების ბაზის ორგანიზება და კონტაქტების მართვა.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="relative group hover:shadow-lg transition-all duration-300 border border-gray-200 bg-white">
              <CardHeader className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-100 group-hover:bg-primary group-hover:text-white transition-colors">
                    <TrendingUp className="h-6 w-6 text-sky-600 group-hover:text-white" />
                  </div>
                </div>
                <CardTitle className="text-xl font-semibold text-gray-900">ანალიტიკა</CardTitle>
                <CardDescription className="text-base leading-relaxed text-gray-600">
                  დეტალური რეპორტები და ბიზნეს ინსაითები.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gray-900 mx-4 my-8 rounded-2xl shadow-lg">
        <div className="container py-16 md:py-20 lg:py-32 text-center text-white">
          <div className="relative z-10 mx-auto max-w-3xl space-y-8">
            <Badge className="bg-primary text-white border-primary">
              <Sparkles className="mr-2 h-3 w-3" />
              შეზღუდული დროით უფასო
            </Badge>
            
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight">
              მზად ხართ <br />
              <span className="text-primary">დაიწყოთ?</span>
            </h2>
            
            <p className="text-xl sm:text-2xl leading-relaxed text-gray-300 max-w-2xl mx-auto">
              შექმენით თქვენი ანგარიში უფასოდ და დაიწყეთ ინვოისების პროფესიონალური მართვა
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
              <Link href="/register">
                <Button size="lg" className="h-14 px-10 text-lg font-semibold bg-primary hover:bg-primary/90 text-white shadow-lg hover:shadow-xl transition-all duration-200">
                  <Zap className="mr-3 h-5 w-5" />
                  უფასო რეგისტრაცია
                  <ArrowRight className="ml-3 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="lg" className="h-14 px-10 text-lg font-semibold bg-transparent border-2 border-gray-400 text-gray-300 hover:bg-white/10 hover:text-white hover:border-gray-300">
                  უკვე გაქვთ ანგარიში?
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300">
        <div className="container py-12 md:py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <span className="font-bold text-lg text-white">Invoice Platform</span>
              </div>
              <p className="text-gray-400 max-w-md leading-relaxed">
                ქართული ბიზნესებისთვის შექმნილი ინვოისების მართვის სისტემა. 
                მარტივი, სწრაფი და უსაფრთხო.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-white mb-4">პლატფორმა</h3>
              <ul className="space-y-2">
                <li><Link href="#features" className="hover:text-white transition-colors">ფუნქციები</Link></li>
                <li><Link href="/help" className="hover:text-white transition-colors">დახმარება</Link></li>
                <li><Link href="/login" className="hover:text-white transition-colors">შესვლა</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-white mb-4">მხარდაჭერა</h3>
              <ul className="space-y-2">
                <li><a href="mailto:support@invoiceplatform.ge" className="hover:text-white transition-colors">support@invoiceplatform.ge</a></li>
                <li><a href="tel:+995555123456" className="hover:text-white transition-colors">+995 555 12 34 56</a></li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}