"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Loader2, 
  Users, 
  UserPlus, 
  Crown, 
  Mail,
  MoreVertical,
  Shield,
  ShieldCheck,
  Trash2,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/components/ui/use-toast"

const roles = {
  owner: { name: 'მფლობელი', color: 'destructive', icon: ShieldCheck },
  admin: { name: 'ადმინი', color: 'default', icon: Shield },
  member: { name: 'წევრი', color: 'secondary', icon: Users },
}

export default function TeamSettingsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [inviteLoading, setInviteLoading] = useState(false)
  const [credits, setCredits] = useState<{ user_id: string; total_credits: number; used_credits: number; plan_type: string } | null>(null)
  const [teamMembers, setTeamMembers] = useState<{ id: string; email: string; full_name: string; role: string; avatar_url: string | null; status: string; invited_at: string }[]>([])
  const [inviteEmail, setInviteEmail] = useState('')
  const supabase = createClient()

  useEffect(() => {
    loadTeamData()
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadTeamData = async () => {
    if (!user) return

    setIsLoading(true)

    try {
      // Load user credits to check plan
      const { data: creditsData } = await supabase
        .from('user_credits')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (creditsData) {
        setCredits(creditsData)
      }

      // For now, just show the current user as owner
      // In a real implementation, you'd have a team_members table
      setTeamMembers([
        {
          id: user.id,
          email: user.email || '',
          full_name: 'თქვენ',
          role: 'owner',
          avatar_url: null,
          status: 'active',
          invited_at: new Date().toISOString(),
        }
      ])

    } catch (error) {
      console.error('Error loading team data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInviteUser = async () => {
    if (!inviteEmail.trim()) return

    setInviteLoading(true)

    try {
      // This would be implemented with a real team invitation system
      toast({
        title: "მოწვევა გაგზავნილია",
        description: `მოწვევა გაიგზავნა ${inviteEmail}-ზე`,
      })
      
      setInviteEmail('')
      
    } catch (error) {
      toast({
        title: "შეცდომა",
        description: error instanceof Error ? error.message : "მოწვევის გაგზავნა ვერ მოხერხდა",
        variant: "destructive",
      })
    } finally {
      setInviteLoading(false)
    }
  }

  const getInitials = (name: string | null) => {
    if (!name) return "U"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const isProPlan = credits?.plan_type === 'pro'

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          გუნდის მართვა
          <Crown className="h-6 w-6 text-yellow-500" />
        </h1>
        <p className="text-gray-500">მართეთ თქვენი გუნდის წევრები და მათი ნებართვები</p>
      </div>

      {!isProPlan && (
        <Alert>
          <Crown className="h-4 w-4 text-yellow-500" />
          <AlertDescription>
            გუნდის მართვა ხელმისაწვდომია მხოლოდ Pro გეგმაზე. 
            <Button variant="link" className="p-0 h-auto ml-1 text-primary">
              განახლება Pro-ზე →
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Invite New Member */}
      <Card className={!isProPlan ? "opacity-50" : ""}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            წევრის დამატება
          </CardTitle>
          <CardDescription>
            მოიწვიეთ ახალი წევრი თქვენს გუნდში
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="invite-email">ელ.ფოსტა</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="user@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                disabled={!isProPlan || inviteLoading}
              />
            </div>
            <div className="flex items-end">
              <Button 
                onClick={handleInviteUser}
                disabled={!isProPlan || inviteLoading || !inviteEmail.trim()}
              >
                {inviteLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    მოწვევა
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team Members */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            გუნდის წევრები
          </CardTitle>
          <CardDescription>
            თქვენი გუნდის ყველა წევრი
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {teamMembers.map((member) => {
              const roleInfo = roles[member.role as keyof typeof roles]
              const RoleIcon = roleInfo.icon

              return (
                <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={member.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary text-white">
                        {getInitials(member.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{member.full_name}</p>
                        <Badge variant={roleInfo.color as "default" | "secondary" | "destructive" | "outline"} className="text-xs">
                          <RoleIcon className="mr-1 h-3 w-3" />
                          {roleInfo.name}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500">{member.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {member.status === 'active' ? 'აქტიური' : 'მოლოდინში'}
                    </Badge>
                    
                    {member.role !== 'owner' && isProPlan && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Shield className="mr-2 h-4 w-4" />
                            როლის შეცვლა
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" />
                            წაშლა
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {!isProPlan && teamMembers.length === 1 && (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p>გუნდის წევრების დამატება</p>
              <p className="text-sm text-gray-400 mt-1">
                ხელმისაწვდომია Pro გეგმაზე
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Team Permissions */}
      <Card className={!isProPlan ? "opacity-50" : ""}>
        <CardHeader>
          <CardTitle>ნებართვების მართვა</CardTitle>
          <CardDescription>
            დააკონფიგურირეთ გუნდის წევრების ნებართვები
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <h4 className="font-medium">ადმინისტრატორები შეუძლიათ:</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• ინვოისების შექმნა და რედაქტირება</li>
                <li>• კლიენტების მართვა</li>
                <li>• რეპორტების ნახვა</li>
                <li>• კომპანიის პარამეტრების შეცვლა</li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium">წევრები შეუძლიათ:</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• ინვოისების შექმნა</li>
                <li>• კლიენტების ნახვა</li>
                <li>• საკუთარი რეპორტების ნახვა</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}