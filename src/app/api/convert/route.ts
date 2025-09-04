import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export async function POST(request: NextRequest) {
  try {
    const { data, fromFormat, toFormat } = await request.json()

    if (!data || !fromFormat || !toFormat) {
      return NextResponse.json(
        { success: false, error: "Dados, formato de origem e destino são obrigatórios" },
        { status: 400 },
      )
    }

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

    return NextResponse.json({
      success: true,
      data: text.trim(),
    })
  } catch (error) {
    console.error("Erro na conversão:", error)
    return NextResponse.json({ success: false, error: "Erro interno do servidor durante a conversão" }, { status: 500 })
  }
}
