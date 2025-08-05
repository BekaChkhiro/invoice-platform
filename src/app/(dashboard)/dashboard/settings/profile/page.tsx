"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, User, Upload, Mail, Phone, AlertCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

const profileSchema = z.object({
  full_name: z.string().min(2, "სახელი სავალდებულოა"),
  phone: z.string().optional(),
})

type ProfileFormData = z.infer<typeof profileSchema>

export default function ProfileSettingsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  })

  useEffect(() => {
    loadProfile()
  }, [user])

  const loadProfile = async () => {
    if (!user) return

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    if (data) {
      setProfile(data)
      reset(data)
    }
  }

  const onSubmit = async (data: ProfileFormData) => {
    if (!user || !profile) return

    setIsLoading(true)

    try {
      const { error } = await supabase
        .from("profiles")
        .update(data)
        .eq("id", user.id)

      if (error) throw error

      toast({
        title: "ცვლილებები შენახულია",
        description: "პროფილის ინფორმაცია წარმატებით განახლდა",
      })

      loadProfile()

    } catch (error: any) {
      toast({
        title: "შეცდომა",
        description: error.message || "ცვლილებების შენახვა ვერ მოხერხდა",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user) return

    // Reset file input
    event.target.value = ''

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "არასწორი ფაილის ტიპი",
        description: "მხოლოდ JPG, PNG, GIF და WebP ფორმატები დაშვებულია",
        variant: "destructive",
      })
      return
    }

    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "ფაილი ძალიან დიდია",
        description: "მაქსიმალური ზომა 2MB",
        variant: "destructive",
      })
      return
    }

    setUploadingAvatar(true)

    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const fileName = `avatar_${Date.now()}.${fileExt}`
      const filePath = `${user.id}/${fileName}`

      // Upload new avatar first
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        throw new Error(`ფაილის ატვირთვა ვერ მოხერხდა: ${uploadError.message}`)
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      if (!publicUrl) {
        throw new Error('ვერ მოხერხდა ფაილის URL-ის მიღება')
      }

      // Update profile record
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id)

      if (updateError) {
        console.error('Profile update error:', updateError)
        // Try to clean up uploaded file if profile update fails
        await supabase.storage.from('avatars').remove([filePath])
        throw new Error(`პროფილის განახლება ვერ მოხერხდა: ${updateError.message}`)
      }

      // Delete old avatar after successful upload and profile update (if exists)
      if (profile?.avatar_url) {
        try {
          const oldUrl = new URL(profile.avatar_url)
          const oldPath = oldUrl.pathname.split('/').slice(-2).join('/') // user_id/filename
          if (oldPath && oldPath !== filePath) {
            await supabase.storage.from('avatars').remove([oldPath])
          }
        } catch (error) {
          // Silently fail - old file cleanup is not critical
          console.warn('Failed to delete old avatar:', error)
        }
      }

      toast({
        title: "ავატარი ატვირთულია",
        description: "პროფილის სურათი წარმატებით განახლდა",
      })

      // Reload profile to get updated data
      await loadProfile()

    } catch (error: any) {
      console.error('Avatar upload error:', error)
      toast({
        title: "შეცდომა",
        description: error.message || "ავატარის ატვირთვა ვერ მოხერხდა",
        variant: "destructive",
      })
    } finally {
      setUploadingAvatar(false)
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

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">პროფილის პარამეტრები</h1>
        <p className="text-gray-500">მართეთ თქვენი პერსონალური ინფორმაცია</p>
      </div>


      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>პროფილის ინფორმაცია</CardTitle>
            <CardDescription>
              განაახლეთ თქვენი პერსონალური ინფორმაცია
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar Upload */}
            <div className="flex items-center gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profile.avatar_url} />
                <AvatarFallback className="bg-primary text-white text-xl">
                  {getInitials(profile.full_name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <Label htmlFor="avatar" className="cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={uploadingAvatar}
                      asChild
                    >
                      <span>
                        {uploadingAvatar ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4" />
                        )}
                        ატვირთვა
                      </span>
                    </Button>
                  </div>
                </Label>
                <Input
                  id="avatar"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                  disabled={uploadingAvatar}
                />
                <p className="text-xs text-gray-500 mt-1">
                  JPG, PNG, GIF, WebP. მაქს. 2MB
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="full_name">სრული სახელი *</Label>
                <Input
                  id="full_name"
                  {...register("full_name")}
                  disabled={isLoading}
                />
                {errors.full_name && (
                  <p className="text-sm text-error">{errors.full_name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">ტელეფონი</Label>
                <Input
                  id="phone"
                  {...register("phone")}
                  disabled={isLoading}
                  placeholder="+995 555 123 456"
                />
              </div>
            </div>

            {/* Email (read-only) */}
            <div className="space-y-2">
              <Label htmlFor="email">ელ.ფოსტა</Label>
              <div className="relative">
                <Input
                  id="email"
                  value={user?.email || ""}
                  disabled
                  className="bg-gray-50"
                />
                <Mail className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
              </div>
              <p className="text-xs text-gray-500">
                ელ.ფოსტის შეცვლისთვის დაუკავშირდით მხარდაჭერას
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Account Security */}
        <Card>
          <CardHeader>
            <CardTitle>ანგარიშის უსაფრთხოება</CardTitle>
            <CardDescription>
              მართეთ თქვენი ანგარიშის უსაფრთხოების პარამეტრები
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                პაროლის შეცვლისთვის გამოიყენეთ "პაროლის აღდგენის" ფუნქცია შესვლის გვერდზე
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button type="submit" disabled={isLoading || !isDirty}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                შენახვა...
              </>
            ) : (
              "ცვლილებების შენახვა"
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}