"use client"

import { useState } from "react"
import { DataConverter } from "@/components/data-converter"
import { ThemeToggle } from "@/components/theme-toggle"
import { LanguageToggle } from "@/components/language-toggle"
import { translations, type Language } from "@/lib/translations"

export default function Home() {
  const [language, setLanguage] = useState<Language>("pt")
  const t = translations[language]

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div></div>
          <div className="flex items-center gap-4">
            <LanguageToggle language={language} onLanguageChange={setLanguage} />
            <ThemeToggle />
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">{t.title}</h1>
          <p className="text-muted-foreground text-lg">{t.subtitle}</p>
        </div>

        <DataConverter language={language} translations={t} />
      </div>
    </main>
  )
}
