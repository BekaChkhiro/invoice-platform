'use client'

import React from 'react'
import { UserGuide, FAQSection, KeyboardShortcutsHelp, VideoTutorials, SupportSystem } from '@/components/ui/documentation'
import { PageSeo } from '@/components/ui/seo-optimization'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import LandingHeader from '@/components/layout/landing-header'
import { FileText } from 'lucide-react'
import Link from 'next/link'

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <LandingHeader />
      
      <div className="container max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <PageSeo
        title="დახმარება და მხარდაჭერა"
        description="გაეცანით ინვოისების მართვის პლატფორმის გამოყენების ინსტრუქციებს, ვიდეო გაკვეთილებს და ხშირად დასმულ კითხვებს."
        keywords="დახმარება, მხარდაჭერა, ინსტრუქცია, ვიდეო გაკვეთილები, ხშირად დასმული კითხვები, ინვოისები"
        canonicalPath="/help"
      />
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">დახმარება და მხარდაჭერა</h1>
        <p className="text-muted-foreground mt-2">
          გაეცანით ინვოისების მართვის პლატფორმის გამოყენების ინსტრუქციებს, ვიდეო გაკვეთილებს და ხშირად დასმულ კითხვებს.
        </p>
      </div>
      
      <div className="grid grid-cols-1 gap-8">
        <Tabs defaultValue="guide" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="guide">სახელმძღვანელო</TabsTrigger>
            <TabsTrigger value="videos">ვიდეო გაკვეთილები</TabsTrigger>
            <TabsTrigger value="faq">ხშირად დასმული კითხვები</TabsTrigger>
            <TabsTrigger value="support">მხარდაჭერა</TabsTrigger>
          </TabsList>
          
          <TabsContent value="guide" className="mt-6">
            <div className="grid grid-cols-1 gap-6">
              <UserGuide />
              
              <Card>
                <CardHeader>
                  <CardTitle>კლავიატურის მალსახმობები</CardTitle>
                  <CardDescription>
                    სისტემაში სწრაფი ნავიგაციისთვის გამოიყენეთ კლავიატურის მალსახმობები
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <KeyboardShortcutsHelp />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="videos" className="mt-6">
            <VideoTutorials />
          </TabsContent>
          
          <TabsContent value="faq" className="mt-6">
            <FAQSection />
          </TabsContent>
          
          <TabsContent value="support" className="mt-6">
            <SupportSystem />
          </TabsContent>
        </Tabs>
      </div>
      </div>
      
      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300">
        <div className="container py-12 md:py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand */}
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
              <div className="flex space-x-4 mt-6">
                <div className="text-sm text-gray-500">
                  © 2025 Invoice Platform. ყველა უფლება დაცულია.
                </div>
              </div>
            </div>
            
            {/* Links */}
            <div>
              <h3 className="font-semibold text-white mb-4">პლატფორმა</h3>
              <ul className="space-y-2">
                <li><a href="/#features" className="hover:text-white transition-colors">ფუნქციები</a></li>
                <li><a href="/#benefits" className="hover:text-white transition-colors">უპირატესობები</a></li>
                <li><Link href="/help" className="hover:text-white transition-colors">დახმარება</Link></li>
                <li><Link href="/login" className="hover:text-white transition-colors">შესვლა</Link></li>
              </ul>
            </div>
            
            {/* Support */}
            <div>
              <h3 className="font-semibold text-white mb-4">მხარდაჭერა</h3>
              <ul className="space-y-2">
                <li><a href="mailto:support@invoiceplatform.ge" className="hover:text-white transition-colors">support@invoiceplatform.ge</a></li>
                <li><a href="tel:+995555123456" className="hover:text-white transition-colors">+995 555 12 34 56</a></li>
                <li><span className="text-green-400">● ონლაინ</span></li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
