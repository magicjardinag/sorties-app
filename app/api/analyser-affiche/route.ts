import { NextResponse } from "next/server"
import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

export async function POST(request: Request) {
  try {
    const { image_base64, media_type } = await request.json()

    if (!image_base64) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 })
    }

    const imageUrl = `data:${media_type || "image/jpeg"};base64,${image_base64}`

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: imageUrl },
            },
            {
              type: "text",
              text: `Analyse cette affiche d'événement et extrait les informations suivantes en JSON.
Réponds UNIQUEMENT avec un objet JSON valide, sans texte avant ou après, sans backticks.

{
  "titre": "nom de l'événement",
  "categorie": "une de ces catégories exactes: Musique, Sport, Culture, Food, Nature, Autre",
  "ville": "ville où se déroule l'événement",
  "date": "date au format YYYY-MM-DD si trouvée, sinon chaîne vide",
  "heure": "heure au format HH:MM si trouvée, sinon chaîne vide",
  "prix": "prix si trouvé (ex: 10€, Gratuit), sinon chaîne vide",
  "description": "résumé détaillé de l'événement en 2-3 phrases"
}

Si une information n'est pas visible sur l'affiche, laisse le champ vide.`,
            },
          ],
        },
      ],
      max_tokens: 1024,
    })

    const text = response.choices?.[0]?.message?.content || ""
    const clean = text.replace(/```json|```/g, "").trim()
    const data = JSON.parse(clean)

    return NextResponse.json({ success: true, data })
  } catch (err: any) {
    console.error("ERREUR OPENAI:", err?.message || err)
    return NextResponse.json({ error: err?.message || "Erreur analyse" }, { status: 500 })
  }
}