"use client"
import { Languages } from "lucide-react"
import { Button } from "@/components/ui/button"

interface LanguageToggleProps {
  language: string
  onLanguageChange: (lang: string) => void
}

export function LanguageToggle({ language, onLanguageChange }: LanguageToggleProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => onLanguageChange(language === "pt" ? "en" : "pt")}
      className="flex items-center gap-2"
    >
      <Languages className="h-4 w-4" />
      {language === "pt" ? "EN" : "PT"}
    </Button>
  )
}
