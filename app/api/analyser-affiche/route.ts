import { NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export async function POST(request: Request) {
  try {
    const { image_url, image_base64, media_type } = await request.json()

    let imageContent: any

    if (image_base64) {
      imageContent = {
        type: "image",
        source: {
          type: "base64",
          media_type: media_type || "image/jpeg",
          data: image_base64,
        },
      }
    } else if (image_url) {
      imageContent = {
        type: "image",
        source: {
          type: "url",
          url: image_url,
        },
      }
    } else {
      return NextResponse.json({ error: "No image provided" }, { status: 400 })
    }

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            imageContent,
            {
              type: "text",
              text: `Analyse cette affiche d'événement et extrait les informations suivantes en JSON.
              Réponds UNIQUEMENT avec un objet JSON valide, sans texte avant ou après.
              
              {
                "titre": "nom de l'événement",
                "categorie": "une de ces catégories: Musique, Sport, Culture, Food, Nature, Autre",
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
    })

    const text = response.content[0].type === "text" ? response.content[0].text : ""
    const clean = text.replace(/```json|```/g, "").trim()
    const data = JSON.parse(clean)

    return NextResponse.json({ success: true, data })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Erreur analyse" }, { status: 500 })
  }
}