"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, ArrowRight, Copy, Check, Wand2, Sparkles, Zap, FileText } from "lucide-react"
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
    <div className="max-w-7xl mx-auto space-y-8 p-6">
      <div className="text-center space-y-4 mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary font-medium text-sm">
          <Zap className="h-4 w-4" />
          {language === "pt" ? "Conversão Inteligente de Dados" : "Smart Data Conversion"}
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          {t.title || (language === "pt" ? "Conversor de Formatos" : "Format Converter")}
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          {language === "pt"
            ? "Converta entre JSON, XML, YAML e CSV com validação automática e inteligência artificial"
            : "Convert between JSON, XML, YAML and CSV with automatic validation and artificial intelligence"}
        </p>
      </div>

      <Card className="card-gradient border-2 hover:border-primary/20 transition-all duration-300">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            {t.formatSelection}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center max-w-md w-full">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">{t.inputFormat}</label>
                <Select value={inputFormat} onValueChange={(value: DataFormat) => setInputFormat(value)}>
                  <SelectTrigger className="h-10 focus-enhanced transition-all duration-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {formatOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value} className="py-2">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                          {option.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-center py-2">
                <div className="p-2 bg-gradient-to-r from-primary/10 to-accent/10 rounded-full animate-pulse-glow">
                  <ArrowRight className="h-4 w-4 text-primary" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">{t.outputFormat}</label>
                <Select value={outputFormat} onValueChange={(value: DataFormat) => setOutputFormat(value)}>
                  <SelectTrigger className="h-10 focus-enhanced transition-all duration-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {formatOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value} className="py-2">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-accent rounded-full"></div>
                          {option.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Area */}
        <Card className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {t.inputData}
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                    {inputFormat.toUpperCase()}
                  </Badge>
                </div>
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={formatData}
                  disabled={!inputData.trim()}
                  className="btn-enhanced transition-all duration-200 hover:bg-primary/5 bg-transparent"
                >
                  <Wand2 className="h-4 w-4 mr-2" />
                  {t.format}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={validateSyntax}
                  disabled={isValidating || !inputData.trim()}
                  className="btn-enhanced transition-all duration-200 hover:bg-accent/5 bg-transparent"
                >
                  {isValidating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {t.validate}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder={
                t.inputPlaceholder?.replace("{format}", inputFormat.toUpperCase()) ||
                `Enter your ${inputFormat.toUpperCase()} data here...`
              }
              value={inputData}
              onChange={(e) => setInputData(e.target.value)}
              className="min-h-[350px] font-mono text-sm focus-enhanced transition-all duration-200 resize-none"
            />

            {validationResult && (
              <Alert
                variant={validationResult.valid ? "default" : "destructive"}
                className="animate-in slide-in-from-top-2 duration-300"
              >
                <AlertDescription className="font-medium">{validationResult.message}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Output Area */}
        <Card className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-accent/20">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {t.convertedData}
                  <Badge variant="secondary" className="bg-accent/10 text-accent border-accent/20">
                    {outputFormat.toUpperCase()}
                  </Badge>
                  {conversionMethod === "ai" && (
                    <Badge
                      variant="outline"
                      className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-blue-600 border-blue-200 animate-shimmer"
                    >
                      <Sparkles className="h-3 w-3 mr-1" />
                      IA
                    </Badge>
                  )}
                </div>
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={copyToClipboard}
                disabled={!outputData}
                className="btn-enhanced transition-all duration-200 hover:bg-accent/5 bg-transparent"
              >
                {copied ? <Check className="h-4 w-4 mr-2 text-green-600" /> : <Copy className="h-4 w-4 mr-2" />}
                {copied ? t.copied : t.copy}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder={t.outputPlaceholder || "Converted data will appear here..."}
              value={outputData}
              readOnly
              className="min-h-[350px] font-mono text-sm bg-muted/50 focus-enhanced resize-none"
            />

            {aiSummary && conversionMethod === "ai" && (
              <Alert className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 animate-in slide-in-from-bottom-2 duration-500">
                <div className="p-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full">
                  <Sparkles className="h-3 w-3 text-white" />
                </div>
                <AlertDescription>
                  <div className="space-y-3">
                    <div className="font-semibold text-blue-900">
                      {language === "pt" ? "Resumo da Conversão por IA:" : "AI Conversion Summary:"}
                    </div>
                    <div className="text-sm text-blue-700 leading-relaxed">{aiSummary}</div>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-center pt-4">
        <Button
          onClick={convertData}
          disabled={isConverting || !inputData.trim()}
          size="lg"
          className="px-12 py-4 text-lg font-semibold bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
        >
          {isConverting ? (
            <>
              <Loader2 className="h-6 w-6 animate-spin mr-3" />
              {t.converting}
            </>
          ) : (
            <>
              <Zap className="h-6 w-6 mr-3" />
              {t.convertData}
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
