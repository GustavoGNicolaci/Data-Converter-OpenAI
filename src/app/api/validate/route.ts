import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export async function POST(request: NextRequest) {
  try {
    const { data, format } = await request.json()

    if (!data || !format) {
      return NextResponse.json({
        valid: false,
        message: "Dados e formato são obrigatórios",
      })
    }

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
    return NextResponse.json(result)
  } catch (error) {
    console.error("Erro na validação:", error)
    return NextResponse.json({
      valid: false,
      message: "Erro interno durante a validação",
    })
  }
}
