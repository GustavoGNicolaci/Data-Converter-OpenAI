import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import * as yaml from "js-yaml"
import * as xml2js from "xml2js"
import Papa from "papaparse"

async function convertWithoutAI(data: string, fromFormat: string, toFormat: string) {
  try {
    let parsedData: any

    // Parse dos dados de entrada
    switch (fromFormat.toLowerCase()) {
      case "json":
        parsedData = JSON.parse(data)
        break
      case "yaml":
      case "yml":
        parsedData = yaml.load(data)
        break
      case "xml":
        const parser = new xml2js.Parser({ explicitArray: false })
        parsedData = await parser.parseStringPromise(data)
        break
      case "csv":
        const csvResult = Papa.parse(data, { header: true, skipEmptyLines: true })
        parsedData = csvResult.data
        break
      default:
        throw new Error(`Formato de origem não suportado: ${fromFormat}`)
    }

    // Conversão para o formato de destino
    switch (toFormat.toLowerCase()) {
      case "json":
        return JSON.stringify(parsedData, null, 2)
      case "yaml":
      case "yml":
        return yaml.dump(parsedData, { indent: 2 })
      case "xml":
        const builder = new xml2js.Builder({ rootName: "root" })
        return builder.buildObject(parsedData)
      case "csv":
        if (Array.isArray(parsedData)) {
          return Papa.unparse(parsedData)
        } else {
          // Se não for array, converte objeto em array
          return Papa.unparse([parsedData])
        }
      default:
        throw new Error(`Formato de destino não suportado: ${toFormat}`)
    }
  } catch (error) {
    throw new Error(`Erro na conversão sem AI: ${error instanceof Error ? error.message : "Erro desconhecido"}`)
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] API Convert - Iniciando conversão")

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY
    const { data, fromFormat, toFormat } = await request.json()

    console.log("[v0] Dados recebidos:", { fromFormat, toFormat, dataLength: data?.length })

    if (!data || !fromFormat || !toFormat) {
      console.log("[v0] Dados obrigatórios ausentes")
      return NextResponse.json(
        { success: false, error: "Dados, formato de origem e destino são obrigatórios" },
        { status: 400 },
      )
    }

    if (OPENAI_API_KEY) {
      try {
        console.log("[v0] Tentando conversão com OpenAI...")
        const { text } = await generateText({
          model: openai("gpt-4o"),
          system: `Você é um especialista em conversão de formatos de dados. Sua tarefa é converter dados de um formato para outro mantendo a estrutura e integridade dos dados.

Regras importantes:
1. Mantenha a estrutura hierárquica dos dados
2. Preserve todos os valores e tipos de dados
3. Use formatação adequada e indentação
4. Para CSV, use vírgulas como separadores e aspas quando necessário
5. Para XML, use tags apropriadas e estrutura válida
6. Para JSON, use sintaxe válida com aspas duplas
7. Para YAML, use indentação correta com espaços

Responda APENAS com os dados convertidos, sem explicações adicionais.`,
          prompt: `Converta os seguintes dados de ${fromFormat.toUpperCase()} para ${toFormat.toUpperCase()}:

${data}`,
        })

        console.log("[v0] Conversão com AI realizada com sucesso")
        return NextResponse.json({
          success: true,
          data: text.trim(),
          method: "ai",
        })
      } catch (aiError) {
        console.log("[v0] Erro na conversão com AI, tentando fallback:", aiError)
      }
    }

    console.log("[v0] Usando conversão sem AI...")
    const convertedData = await convertWithoutAI(data, fromFormat, toFormat)

    console.log("[v0] Conversão sem AI realizada com sucesso")
    return NextResponse.json({
      success: true,
      data: convertedData,
      method: "native",
    })
  } catch (error) {
    console.error("[v0] Erro na conversão:", error)
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido"
    return NextResponse.json(
      {
        success: false,
        error: `Erro durante a conversão: ${errorMessage}`,
      },
      { status: 500 },
    )
  }
}
