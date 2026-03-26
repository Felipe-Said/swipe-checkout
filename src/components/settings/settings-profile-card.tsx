"use client"

import * as React from "react"
import { Camera, Mail, User, X, Plus } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useI18n } from "@/lib/i18n"

interface SettingsProfileCardProps {
  name: string
  email: string
  profileImage?: string
  onNameChange: (value: string) => void
  onEmailChange: (value: string) => void
  onImageChange: (base64: string) => void
  onImageRemove: () => void
  onSave: () => void
  isLoading?: boolean
}

export function SettingsProfileCard({
  name,
  email,
  profileImage,
  onNameChange,
  onEmailChange,
  onImageChange,
  onImageRemove,
  onSave,
  isLoading = false
}: SettingsProfileCardProps) {
  const { t } = useI18n()
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        onImageChange(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()

  return (
    <Card className="border-primary/10 bg-card/40 backdrop-blur-sm shadow-xl overflow-hidden group">
      <CardHeader className="bg-primary/5 pb-6 border-b border-primary/10 relative">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
            <User className="h-6 w-6" />
          </div>
          <div>
            <CardTitle className="text-xl">{t("settings.profile.title")}</CardTitle>
            <CardDescription>{t("settings.profile.desc")}</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-8 space-y-10">
        <div className="flex flex-col md:flex-row items-center gap-10">
          <div className="relative group/avatar">
            <Avatar className="h-32 w-32 border-4 border-primary/10 shadow-2xl transition-all group-hover/avatar:border-primary/30">
              <AvatarImage src={profileImage} className="object-cover" />
              <AvatarFallback className="bg-primary/5 text-primary text-4xl font-black">
                {initials}
              </AvatarFallback>
            </Avatar>
            
            <div className="absolute -bottom-2 -right-2 flex gap-2">
               <Button 
                size="icon" 
                variant="outline"
                className="h-10 w-10 rounded-xl bg-background border-primary/20 shadow-lg group-hover/avatar:scale-110 transition-transform"
                onClick={() => fileInputRef.current?.click()}
               >
                  <Camera className="h-5 w-5 text-primary" />
               </Button>
               {profileImage && (
                  <Button 
                    size="icon" 
                    variant="outline"
                    className="h-10 w-10 rounded-xl bg-background border-destructive/20 text-destructive shadow-lg group-hover/avatar:scale-110 transition-transform"
                    onClick={onImageRemove}
                  >
                     <X className="h-5 w-5" />
                  </Button>
               )}
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleFileChange} 
            />
          </div>

          <div className="flex-1 space-y-6 w-full">
            <div className="space-y-3">
              <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                {t("settings.profile.name")}
              </Label>
              <div className="relative group/input">
                 <Input 
                   value={name}
                   onChange={(e) => onNameChange(e.target.value)}
                   className="h-12 bg-muted/20 border-primary/5 rounded-xl px-4 focus-visible:ring-primary/20 transition-all font-bold"
                 />
                 <User className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40 group-focus-within/input:text-primary transition-colors" />
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                {t("settings.profile.email")}
              </Label>
              <div className="relative group/input">
                 <Input 
                   value={email}
                   onChange={(e) => onEmailChange(e.target.value)}
                   type="email"
                   className="h-12 bg-muted/20 border-primary/5 rounded-xl px-4 focus-visible:ring-primary/20 transition-all font-bold"
                 />
                 <Mail className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40 group-focus-within/input:text-primary transition-colors" />
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4">
           <Button 
             className="w-full md:w-auto h-12 px-10 text-lg font-black tracking-tighter rounded-xl shadow-lg shadow-primary/20 group relative overflow-hidden" 
             onClick={onSave}
             disabled={isLoading}
           >
              <span className="relative z-10 flex items-center gap-2">
                 {isLoading ? t("settings.profile.saving") : t("settings.profile.save")}
                 {!isLoading && <User className="h-5 w-5" />}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-primary-foreground/0 via-primary-foreground/10 to-primary-foreground/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
           </Button>
        </div>
      </CardContent>
    </Card>
  )
}
