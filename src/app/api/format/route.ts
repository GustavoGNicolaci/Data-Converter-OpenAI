import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export async function POST(request: NextRequest) {
  try {
    const { data, format } = await request.json()

    if (!data || !format) {
      return NextResponse.json({ success: false, error: "Dados e formato são obrigatórios" }, { status: 400 })
    }

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
    })
  } catch (error) {
    console.error("Erro na formatação:", error)
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor durante a formatação" },
      { status: 500 },
    )
  }
}
