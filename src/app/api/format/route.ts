import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import * as yaml from "js-yaml"
import * as xml2js from "xml2js"
import Papa from "papaparse"

function formatWithoutAI(data: string, format: string) {
  try {
    switch (format.toLowerCase()) {
      case "json":
        const jsonData = JSON.parse(data)
        return JSON.stringify(jsonData, null, 2)

      case "yaml":
      case "yml":
        const yamlData = yaml.load(data)
        return yaml.dump(yamlData, { indent: 2, lineWidth: -1 })

      case "xml":
        const parser = new xml2js.Parser({ explicitArray: false })
        const builder = new xml2js.Builder({
          renderOpts: { pretty: true, indent: "  " },
          headless: false,
        })
        return parser.parseStringPromise(data).then((result) => {
          return builder.buildObject(result)
        })

      case "csv":
        const csvResult = Papa.parse(data, { header: true, skipEmptyLines: true })
        if (csvResult.errors.length > 0) {
          throw new Error(`Erro no CSV: ${csvResult.errors[0].message}`)
        }
        return Papa.unparse(csvResult.data, { header: true })

      default:
        throw new Error(`Formato não suportado: ${format}`)
    }
  } catch (error) {
    throw new Error(`Erro na formatação: ${error instanceof Error ? error.message : "Erro desconhecido"}`)
  }
}

export async function POST(request: NextRequest) {
  try {
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY
    const { data, format } = await request.json()

    if (!data || !format) {
      return NextResponse.json({ success: false, error: "Dados e formato são obrigatórios" }, { status: 400 })
    }

    if (OPENAI_API_KEY) {
      try {
        const { text } = await generateText({
          model: openai("gpt-4o"),
          system: `Você é um formatador automático de dados. Sua tarefa é formatar e indentar corretamente os dados no formato especificado.

Regras de formatação:
- JSON: Indentação de 2 espaços, chaves e arrays bem estruturados
- XML: Indentação de 2 espaços, tags bem organizadas
- YAML: Indentação correta com espaços (não tabs)
- CSV: Colunas alinhadas, aspas quando necessário

Responda APENAS com os dados formatados, sem explicações adicionais.`,
          prompt: `Formate e indente corretamente os seguintes dados ${format.toUpperCase()}:

${data}`,
        })

        return NextResponse.json({
          success: true,
          data: text.trim(),
          method: "ai",
        })
      } catch (aiError) {
        console.log("Erro na formatação com AI, usando fallback:", aiError)
      }
    }

    const formattedData = await formatWithoutAI(data, format)

    return NextResponse.json({
      success: true,
      data: formattedData,
      method: "native",
    })
  } catch (error) {
    console.error("Erro na formatação:", error)
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido"
    return NextResponse.json({ success: false, error: `Erro durante a formatação: ${errorMessage}` }, { status: 500 })
  }
}