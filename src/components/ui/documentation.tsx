'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'

// User guide component
interface UserGuideProps {
  children?: React.ReactNode
}

export function UserGuide({ children }: UserGuideProps) {
  const [activeTab, setActiveTab] = useState('getting-started')
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>სახელმძღვანელო</CardTitle>
        <CardDescription>
          როგორ გამოიყენოთ ინვოისების მართვის სისტემა
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 mb-6">
            <TabsTrigger value="getting-started">დაწყება</TabsTrigger>
            <TabsTrigger value="invoices">ინვოისები</TabsTrigger>
            <TabsTrigger value="clients">კლიენტები</TabsTrigger>
            <TabsTrigger value="settings">პარამეტრები</TabsTrigger>
          </TabsList>
          
          <TabsContent value="getting-started" className="space-y-4">
            <h3 className="text-lg font-medium">როგორ დავიწყოთ მუშაობა</h3>
            <p>ინვოისების მართვის სისტემა საშუალებას გაძლევთ მარტივად შექმნათ და მართოთ ინვოისები.</p>
            
            <div className="space-y-4">
              <div className="border rounded-md p-4">
                <h4 className="font-medium mb-2">1. რეგისტრაცია და შესვლა</h4>
                <p>შექმენით ანგარიში და შედით სისტემაში თქვენი ელ.ფოსტით და პაროლით.</p>
              </div>
              
              <div className="border rounded-md p-4">
                <h4 className="font-medium mb-2">2. პროფილის შევსება</h4>
                <p>შეავსეთ თქვენი კომპანიის ინფორმაცია პარამეტრების გვერდზე.</p>
              </div>
              
              <div className="border rounded-md p-4">
                <h4 className="font-medium mb-2">3. კლიენტების დამატება</h4>
                <p>დაამატეთ თქვენი კლიენტები სისტემაში.</p>
              </div>
              
              <div className="border rounded-md p-4">
                <h4 className="font-medium mb-2">4. პირველი ინვოისის შექმნა</h4>
                <p>შექმენით თქვენი პირველი ინვოისი "ინვოისები" გვერდზე.</p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="invoices" className="space-y-4">
            <h3 className="text-lg font-medium">როგორ შევქმნათ ინვოისი</h3>
            <p>ინვოისის შექმნა და მართვა მარტივია ჩვენს სისტემაში.</p>
            
            <div className="space-y-4">
              <div className="border rounded-md p-4">
                <h4 className="font-medium mb-2">1. ახალი ინვოისის შექმნა</h4>
                <p>დააჭირეთ "ახალი ინვოისი" ღილაკს ინვოისების გვერდზე.</p>
              </div>
              
              <div className="border rounded-md p-4">
                <h4 className="font-medium mb-2">2. კლიენტის არჩევა</h4>
                <p>აირჩიეთ კლიენტი ჩამონათვალიდან ან დაამატეთ ახალი.</p>
              </div>
              
              <div className="border rounded-md p-4">
                <h4 className="font-medium mb-2">3. პროდუქტების დამატება</h4>
                <p>დაამატეთ პროდუქტები ან სერვისები ინვოისში.</p>
              </div>
              
              <div className="border rounded-md p-4">
                <h4 className="font-medium mb-2">4. ინვოისის გაგზავნა</h4>
                <p>შენახვის შემდეგ შეგიძლიათ გააგზავნოთ ინვოისი ელ.ფოსტით ან ჩამოტვირთოთ PDF ფორმატში.</p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="clients" className="space-y-4">
            <h3 className="text-lg font-medium">კლიენტების მართვა</h3>
            <p>კლიენტების დამატება და მართვა.</p>
            
            <div className="space-y-4">
              <div className="border rounded-md p-4">
                <h4 className="font-medium mb-2">1. კლიენტის დამატება</h4>
                <p>დააჭირეთ "ახალი კლიენტი" ღილაკს კლიენტების გვერდზე.</p>
              </div>
              
              <div className="border rounded-md p-4">
                <h4 className="font-medium mb-2">2. კლიენტის ინფორმაციის შევსება</h4>
                <p>შეავსეთ კლიენტის საკონტაქტო ინფორმაცია და საგადასახადო დეტალები.</p>
              </div>
              
              <div className="border rounded-md p-4">
                <h4 className="font-medium mb-2">3. კლიენტის რედაქტირება</h4>
                <p>კლიენტის ინფორმაციის განახლება შესაძლებელია ნებისმიერ დროს.</p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="settings" className="space-y-4">
            <h3 className="text-lg font-medium">პარამეტრების კონფიგურაცია</h3>
            <p>სისტემის პარამეტრების მორგება თქვენს საჭიროებებზე.</p>
            
            <div className="space-y-4">
              <div className="border rounded-md p-4">
                <h4 className="font-medium mb-2">1. კომპანიის ინფორმაცია</h4>
                <p>შეავსეთ თქვენი კომპანიის დეტალები და ლოგო.</p>
              </div>
              
              <div className="border rounded-md p-4">
                <h4 className="font-medium mb-2">2. ინვოისის შაბლონები</h4>
                <p>მოარგეთ ინვოისის შაბლონები თქვენს ბრენდს.</p>
              </div>
              
              <div className="border rounded-md p-4">
                <h4 className="font-medium mb-2">3. ელ.ფოსტის პარამეტრები</h4>
                <p>დააკონფიგურირეთ ელ.ფოსტის შაბლონები და პარამეტრები.</p>
              </div>
              
              <div className="border rounded-md p-4">
                <h4 className="font-medium mb-2">4. მომხმარებლების მართვა</h4>
                <p>დაამატეთ და მართეთ გუნდის წევრები და მათი უფლებები.</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        {children}
      </CardContent>
    </Card>
  )
}

// FAQ section
interface FAQProps {
  className?: string
}

export function FAQSection({ className }: FAQProps) {
  const [searchQuery, setSearchQuery] = useState('')
  
  const faqItems = [
    {
      question: 'როგორ შევქმნა ინვოისი?',
      answer: 'ინვოისის შესაქმნელად გადადით &ldquo;ინვოისები&rdquo; გვერდზე, დააჭირეთ &ldquo;ახალი ინვოისი&rdquo; ღილაკს, აირჩიეთ კლიენტი, დაამატეთ პროდუქტები და დააჭირეთ &ldquo;შენახვა&rdquo;.',
    },
    {
      question: 'როგორ გავაგზავნო ინვოისი ელ.ფოსტით?',
      answer: 'ინვოისის გვერდზე აირჩიეთ სასურველი ინვოისი და დააჭირეთ "გაგზავნა" ღილაკს. შეგიძლიათ დაამატოთ პერსონალიზებული შეტყობინება გაგზავნამდე.',
    },
    {
      question: 'როგორ დავამატო ახალი კლიენტი?',
      answer: 'კლიენტის დასამატებლად გადადით &ldquo;კლიენტები&rdquo; გვერდზე, დააჭირეთ &ldquo;ახალი კლიენტი&rdquo; ღილაკს და შეავსეთ საჭირო ინფორმაცია.',
    },
    {
      question: 'როგორ შევცვალო ჩემი კომპანიის ლოგო?',
      answer: 'კომპანიის ლოგოს შესაცვლელად გადადით &ldquo;პარამეტრები&rdquo; გვერდზე, აირჩიეთ &ldquo;კომპანიის ინფორმაცია&rdquo; და ატვირთეთ ახალი ლოგო.',
    },
    {
      question: 'როგორ დავაგენერირო ანგარიშები?',
      answer: 'ანგარიშების დასაგენერირებლად გადადით &ldquo;ანალიტიკა&rdquo; გვერდზე, აირჩიეთ სასურველი პერიოდი და ანგარიშის ტიპი, შემდეგ დააჭირეთ &ldquo;დაგენერირება&rdquo; ღილაკს.',
    },
    {
      question: 'როგორ დავამატო ახალი მომხმარებელი?',
      answer: 'ახალი მომხმარებლის დასამატებლად გადადით &ldquo;პარამეტრები&rdquo; გვერდზე, აირჩიეთ &ldquo;მომხმარებლები&rdquo;, დააჭირეთ &ldquo;ახალი მომხმარებელი&rdquo; და შეავსეთ საჭირო ინფორმაცია.',
    },
    {
      question: 'როგორ შევცვალო ინვოისის შაბლონი?',
      answer: 'ინვოისის შაბლონის შესაცვლელად გადადით &ldquo;პარამეტრები&rdquo; გვერდზე, აირჩიეთ &ldquo;ინვოისის შაბლონები&rdquo; და მოარგეთ სასურველი შაბლონი.',
    },
    {
      question: 'როგორ დავამატო გადასახადი ინვოისში?',
      answer: 'ინვოისში გადასახადის დასამატებლად, ინვოისის შექმნისას აირჩიეთ შესაბამისი გადასახადის განაკვეთი ან დაამატეთ ახალი "პარამეტრები > გადასახადები" გვერდზე.',
    },
  ]
  
  const filteredFAQs = searchQuery 
    ? faqItems.filter(item => 
        item.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
        item.answer.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : faqItems
  
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>ხშირად დასმული კითხვები</CardTitle>
        <CardDescription>
          გაეცანით პასუხებს ხშირად დასმულ კითხვებზე
        </CardDescription>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="მოძებნეთ კითხვები..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <Accordion type="single" collapsible className="w-full">
            {filteredFAQs.map((item, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger>{item.question}</AccordionTrigger>
                <AccordionContent>{item.answer}</AccordionContent>
              </AccordionItem>
            ))}
            {filteredFAQs.length === 0 && (
              <p className="text-center py-4 text-muted-foreground">
                კითხვები ვერ მოიძებნა. სცადეთ სხვა საძიებო სიტყვა.
              </p>
            )}
          </Accordion>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

// Keyboard shortcuts help
interface KeyboardShortcut {
  key: string;
  description: string;
  scope: 'global' | 'invoices' | 'clients' | 'dashboard';
}

export function KeyboardShortcutsHelp() {
  const [open, setOpen] = useState(false)
  
  const shortcuts: KeyboardShortcut[] = [
    { key: '/', description: 'ძიება', scope: 'global' },
    { key: 'n', description: 'ახალი ინვოისი', scope: 'invoices' },
    { key: 'c', description: 'ახალი კლიენტი', scope: 'clients' },
    { key: 'h', description: 'მთავარ გვერდზე დაბრუნება', scope: 'global' },
    { key: 'j', description: 'შემდეგ ელემენტზე გადასვლა', scope: 'global' },
    { key: 'k', description: 'წინა ელემენტზე გადასვლა', scope: 'global' },
    { key: 'e', description: 'მიმდინარე ელემენტის რედაქტირება', scope: 'global' },
    { key: 's', description: 'შენახვა', scope: 'global' },
    { key: 'p', description: 'ბეჭდვა', scope: 'invoices' },
    { key: 'd', description: 'წაშლა', scope: 'global' },
    { key: 'f', description: 'ფილტრი', scope: 'global' },
    { key: 'r', description: 'განახლება', scope: 'global' },
    { key: 'Esc', description: 'დახურვა / გაუქმება', scope: 'global' },
  ]
  
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        კლავიატურის მალსახმობები
      </Button>
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>კლავიატურის მალსახმობები</DialogTitle>
            <DialogDescription>
              სისტემაში ნავიგაციის გასამარტივებლად გამოიყენეთ შემდეგი მალსახმობები
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="global">
            <TabsList className="grid grid-cols-4 mb-4">
              <TabsTrigger value="global">ზოგადი</TabsTrigger>
              <TabsTrigger value="invoices">ინვოისები</TabsTrigger>
              <TabsTrigger value="clients">კლიენტები</TabsTrigger>
              <TabsTrigger value="dashboard">დეშბორდი</TabsTrigger>
            </TabsList>
            
            {['global', 'invoices', 'clients', 'dashboard'].map((scope) => (
              <TabsContent key={scope} value={scope} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {shortcuts
                    .filter((shortcut) => shortcut.scope === scope)
                    .map((shortcut, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded">
                        <span className="font-medium bg-muted px-2 py-1 rounded">
                          {shortcut.key}
                        </span>
                        <span>{shortcut.description}</span>
                      </div>
                    ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  )
}

// Video tutorials component
interface VideoTutorial {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  videoUrl: string;
  duration: string;
  category: 'getting-started' | 'invoices' | 'clients' | 'settings';
}

export function VideoTutorials() {
  const [activeTab, setActiveTab] = useState('getting-started')
  
  const tutorials: VideoTutorial[] = [
    {
      id: 'video-1',
      title: 'სისტემის გაცნობა',
      description: 'გაეცანით ინვოისების მართვის სისტემის ძირითად ფუნქციებს',
      thumbnailUrl: '/images/tutorials/getting-started.jpg',
      videoUrl: '/videos/getting-started.mp4',
      duration: '3:45',
      category: 'getting-started',
    },
    {
      id: 'video-2',
      title: 'პირველი ინვოისის შექმნა',
      description: 'ნაბიჯ-ნაბიჯ ინსტრუქცია პირველი ინვოისის შესაქმნელად',
      thumbnailUrl: '/images/tutorials/create-invoice.jpg',
      videoUrl: '/videos/create-invoice.mp4',
      duration: '4:20',
      category: 'invoices',
    },
    {
      id: 'video-3',
      title: 'კლიენტების მართვა',
      description: 'როგორ დავამატოთ და ვმართოთ კლიენტები სისტემაში',
      thumbnailUrl: '/images/tutorials/manage-clients.jpg',
      videoUrl: '/videos/manage-clients.mp4',
      duration: '3:10',
      category: 'clients',
    },
    {
      id: 'video-4',
      title: 'სისტემის პარამეტრების კონფიგურაცია',
      description: 'როგორ მოვარგოთ სისტემა ჩვენს საჭიროებებს',
      thumbnailUrl: '/images/tutorials/system-settings.jpg',
      videoUrl: '/videos/system-settings.mp4',
      duration: '5:30',
      category: 'settings',
    },
  ]
  
  const filteredTutorials = tutorials.filter(
    (tutorial) => tutorial.category === activeTab
  )
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>ვიდეო გაკვეთილები</CardTitle>
        <CardDescription>
          ვიზუალური ინსტრუქციები სისტემის გამოსაყენებლად
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 mb-6">
            <TabsTrigger value="getting-started">დაწყება</TabsTrigger>
            <TabsTrigger value="invoices">ინვოისები</TabsTrigger>
            <TabsTrigger value="clients">კლიენტები</TabsTrigger>
            <TabsTrigger value="settings">პარამეტრები</TabsTrigger>
          </TabsList>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTutorials.map((tutorial) => (
              <Card key={tutorial.id} className="overflow-hidden">
                <div className="relative aspect-video bg-muted">
                  <img
                    src={tutorial.thumbnailUrl}
                    alt={tutorial.title}
                    className="object-cover w-full h-full"
                  />
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 text-xs rounded">
                    {tutorial.duration}
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-medium mb-1">{tutorial.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {tutorial.description}
                  </p>
                  <Button size="sm" className="w-full">
                    ნახვა
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </Tabs>
      </CardContent>
    </Card>
  )
}

// Support system component
export function SupportSystem() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>დახმარება და მხარდაჭერა</CardTitle>
        <CardDescription>
          დაგვიკავშირდით თუ გჭირდებათ დამატებითი დახმარება
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <h3 className="font-medium mb-2">ელ.ფოსტა</h3>
              <p className="text-sm text-muted-foreground mb-4">
                დაგვიკავშირდით ელ.ფოსტით
              </p>
              <Button variant="outline" className="w-full">
                support@invoice-platform.ge
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6 text-center">
              <h3 className="font-medium mb-2">ცოცხალი ჩატი</h3>
              <p className="text-sm text-muted-foreground mb-4">
                ისაუბრეთ ჩვენს გუნდთან პირდაპირ
              </p>
              <Button className="w-full">
                ჩატის დაწყება
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6 text-center">
              <h3 className="font-medium mb-2">ცოდნის ბაზა</h3>
              <p className="text-sm text-muted-foreground mb-4">
                გაეცანით დეტალურ სტატიებს
              </p>
              <Button variant="outline" className="w-full">
                ცოდნის ბაზის ნახვა
              </Button>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardContent className="pt-6">
            <h3 className="font-medium mb-2">ხშირად დასმული კითხვები</h3>
            <p className="text-sm text-muted-foreground mb-4">
              ნახეთ პასუხები ხშირად დასმულ კითხვებზე
            </p>
            <Button variant="outline" className="w-full">
              FAQ გვერდზე გადასვლა
            </Button>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  )
}
