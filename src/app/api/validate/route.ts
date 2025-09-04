import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import * as yaml from "js-yaml"
import * as xml2js from "xml2js"
import Papa from "papaparse"

function validateWithoutAI(data: string, format: string) {
  try {
    switch (format.toLowerCase()) {
      case "json":
        JSON.parse(data)
        return { valid: true, message: "JSON válido" }

      case "yaml":
      case "yml":
        yaml.load(data)
        return { valid: true, message: "YAML válido" }

      case "xml":
        // Validação básica de XML
        const parser = new xml2js.Parser()
        parser.parseString(data)
        return { valid: true, message: "XML válido" }

      case "csv":
        const result = Papa.parse(data, { skipEmptyLines: true })
        if (result.errors.length > 0) {
          return { valid: false, message: `Erro no CSV: ${result.errors[0].message}` }
        }
        return { valid: true, message: "CSV válido" }

      default:
        return { valid: false, message: `Formato não suportado: ${format}` }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido"
    return { valid: false, message: `Formato inválido: ${errorMessage}` }
  }
}

export async function POST(request: NextRequest) {
  try {
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY
    const { data, format } = await request.json()

    if (!data || !format) {
      return NextResponse.json({
        valid: false,
        message: "Dados e formato são obrigatórios",
      })
    }

    if (OPENAI_API_KEY) {
      try {
        const { text } = await generateText({
          model: openai("gpt-4o"),
          system: `Você é um validador de sintaxe para formatos de dados. Analise se os dados fornecidos estão em formato válido.

Responda APENAS com um JSON no formato:
{
  "valid": true/false,
  "message": "mensagem explicativa em português"
}

Para cada formato:
- JSON: Verifique sintaxe válida, chaves entre aspas, vírgulas corretas
- XML: Verifique tags balanceadas, sintaxe válida
- YAML: Verifique indentação, sintaxe válida
- CSV: Verifique estrutura de colunas consistente`,
          prompt: `Valide a sintaxe dos seguintes dados no formato ${format.toUpperCase()}:

${data}`,
        })

        const result = JSON.parse(text.trim())
        return NextResponse.json({ ...result, method: "ai" })
      } catch (aiError) {
        console.log("Erro na validação com AI, usando fallback:", aiError)
      }
    }

    const result = validateWithoutAI(data, format)
    return NextResponse.json({ ...result, method: "native" })
  } catch (error) {
    console.error("Erro na validação:", error)
    return NextResponse.json({
      valid: false,
      message: "Erro interno durante a validação",
    })
  }
}