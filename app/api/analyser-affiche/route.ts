import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { image_base64, media_type } = await request.json()

    if (!image_base64) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 })
    }

    const apiKey = process.env.GOOGLE_AI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "Clé API Google manquante" }, { status: 500 })
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  inline_data: {
                    mime_type: media_type || "image/jpeg",
                    data: image_base64,
                  },
                },
                {
                  text: `Tu es un assistant spécialisé dans la lecture d'affiches d'événements français.
Analyse cette affiche et extrait toutes les informations visibles.
Réponds UNIQUEMENT avec un objet JSON valide, sans texte avant ou après, sans backticks.

{
  "titre": "nom complet de l'événement tel qu'écrit sur l'affiche",
  "categorie": "une de ces catégories exactes: Musique, Sport, Danse, Culture, Atelier, Food, Nature & Rando, Animaux, Brocante, Bar & Nuit, Loto, Enfants, Autre",
  "ville": "ville où se déroule l'événement",
  "date": "date au format YYYY-MM-DD si trouvée, sinon chaîne vide",
  "heure": "heure au format HH:MM si trouvée, sinon chaîne vide",
  "prix": "prix si trouvé (ex: 10€, Gratuit), sinon chaîne vide",
  "organisateur": "nom de l'organisateur ou association si visible, sinon chaîne vide",
  "description": "résumé détaillé et accrocheur de l'événement en 2-3 phrases, en français"
}

Si une information n'est pas visible sur l'affiche, laisse le champ vide.`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 1024,
          },
        }),
      }
    )

    if (!response.ok) {
      const err = await response.text()
      console.error("Gemini error:", err)
      return NextResponse.json({ error: "Erreur Gemini API" }, { status: 500 })
    }

    const result = await response.json()
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text || ""
    const clean = text.replace(/```json|```/g, "").trim()
    const data = JSON.parse(clean)

    return NextResponse.json({ success: true, data })
  } catch (err: any) {
    console.error("ERREUR GEMINI:", err?.message || err)
    return NextResponse.json({ error: err?.message || "Erreur analyse" }, { status: 500 })
  }
}
