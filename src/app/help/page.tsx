'use client'

import React from 'react'
import { UserGuide, FAQSection, KeyboardShortcutsHelp, VideoTutorials, SupportSystem } from '@/components/ui/documentation'
import { PageSeo } from '@/components/ui/seo-optimization'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function HelpPage() {
  return (
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
  )
}
