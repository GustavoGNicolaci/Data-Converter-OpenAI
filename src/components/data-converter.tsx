"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, ArrowRight, Copy, Check, Wand2, Sparkles } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type DataFormat = "json" | "xml" | "yaml" | "csv"

interface ConversionResult {
  success: boolean
  data?: string
  error?: string
  method?: "ai" | "native"
  summary?: string
}

interface DataConverterProps {
  language: string
  translations: any
}

export function DataConverter({ language, translations: t }: DataConverterProps) {
  const [inputData, setInputData] = useState("")
  const [outputData, setOutputData] = useState("")
  const [inputFormat, setInputFormat] = useState<DataFormat>("json")
  const [outputFormat, setOutputFormat] = useState<DataFormat>("xml")
  const [isConverting, setIsConverting] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  const [validationResult, setValidationResult] = useState<{ valid: boolean; message: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const [aiSummary, setAiSummary] = useState<string>("")
  const [conversionMethod, setConversionMethod] = useState<"ai" | "native" | null>(null)
  const { toast } = useToast()

  const formatOptions = [
    { value: "json", label: "JSON" },
    { value: "xml", label: "XML" },
    { value: "yaml", label: "YAML" },
    { value: "csv", label: "CSV" },
  ]

  const validateSyntax = async () => {
    if (!inputData.trim()) {
      setValidationResult({ valid: false, message: t.noDataToValidate })
      return
    }

    setIsValidating(true)
    try {
      const response = await fetch("/api/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: inputData, format: inputFormat }),
      })

      const result = await response.json()
      setValidationResult(result)
    } catch (error) {
      setValidationResult({ valid: false, message: t.errorValidating })
    } finally {
      setIsValidating(false)
    }
  }

  const convertData = async () => {
    if (!inputData.trim()) {
      toast({
        title: t.error,
        description: t.pleaseEnterData,
        variant: "destructive",
      })
      return
    }

    setIsConverting(true)
    setAiSummary("")
    setConversionMethod(null)

    try {
      const response = await fetch("/api/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: inputData,
          fromFormat: inputFormat,
          toFormat: outputFormat,
        }),
      })

      const result: ConversionResult = await response.json()

      if (result.success && result.data) {
        setOutputData(result.data)
        setConversionMethod(result.method || "native")
        if (result.method === "ai" && result.summary) {
          setAiSummary(result.summary)
        }

        toast({
          title: t.success,
          description: t.conversionSuccess
            .replace("{from}", inputFormat.toUpperCase())
            .replace("{to}", outputFormat.toUpperCase()),
        })
      } else {
        toast({
          title: t.conversionError,
          description: result.error || t.unknownError,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: t.error,
        description: t.serverError,
        variant: "destructive",
      })
    } finally {
      setIsConverting(false)
    }
  }

  const formatData = async () => {
    if (!inputData.trim()) return

    try {
      const response = await fetch("/api/format", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: inputData, format: inputFormat }),
      })

      const result = await response.json()
      if (result.success) {
        setInputData(result.data)
        toast({
          title: t.formatted,
          description: t.autoFormatted,
        })
      }
    } catch (error) {
      toast({
        title: t.error,
        description: t.formatError,
        variant: "destructive",
      })
    }
  }

  const copyToClipboard = async () => {
    if (!outputData) return

    try {
      await navigator.clipboard.writeText(outputData)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast({
        title: t.copied,
        description: t.copySuccess,
      })
    } catch (error) {
      toast({
        title: t.error,
        description: t.copyError,
        variant: "destructive",
      })
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Format Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRight className="h-5 w-5 text-primary" />
            {t.formatSelection}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t.inputFormat}</label>
              <Select value={inputFormat} onValueChange={(value: DataFormat) => setInputFormat(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {formatOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-center">
              <ArrowRight className="h-6 w-6 text-muted-foreground" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t.outputFormat}</label>
              <Select value={outputFormat} onValueChange={(value: DataFormat) => setOutputFormat(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {formatOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Input/Output Areas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Area */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                {t.inputData}
                <Badge variant="secondary">{inputFormat.toUpperCase()}</Badge>
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={formatData} disabled={!inputData.trim()}>
                  <Wand2 className="h-4 w-4 mr-1" />
                  {t.format}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={validateSyntax}
                  disabled={isValidating || !inputData.trim()}
                >
                  {isValidating ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                  {t.validate}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder={t.inputPlaceholder.replace("{format}", inputFormat.toUpperCase())}
              value={inputData}
              onChange={(e) => setInputData(e.target.value)}
              className="min-h-[300px] font-mono text-sm"
            />

            {validationResult && (
              <Alert variant={validationResult.valid ? "default" : "destructive"}>
                <AlertDescription>{validationResult.message}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Output Area */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                {t.convertedData}
                <Badge variant="secondary">{outputFormat.toUpperCase()}</Badge>
                {conversionMethod === "ai" && (
                  <Badge variant="outline" className="text-blue-600 border-blue-600">
                    <Sparkles className="h-3 w-3 mr-1" />
                    IA
                  </Badge>
                )}
              </CardTitle>
              <Button variant="outline" size="sm" onClick={copyToClipboard} disabled={!outputData}>
                {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                {copied ? t.copied : t.copy}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder={t.outputPlaceholder}
              value={outputData}
              readOnly
              className="min-h-[300px] font-mono text-sm bg-muted"
            />

            {aiSummary && conversionMethod === "ai" && (
              <Alert>
                <Sparkles className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <div className="font-medium">
                      {language === "pt" ? "Resumo da Conversão por IA:" : "AI Conversion Summary:"}
                    </div>
                    <div className="text-sm text-muted-foreground">{aiSummary}</div>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Convert Button */}
      <div className="flex justify-center">
        <Button onClick={convertData} disabled={isConverting || !inputData.trim()} size="lg" className="px-8">
          {isConverting ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <ArrowRight className="h-5 w-5 mr-2" />}
          {isConverting ? t.converting : t.convertData}
        </Button>
      </div>
    </div>
  )
}
