import { NextResponse } from "next/server"
import { Resend } from "resend"
import { createClient } from "@supabase/supabase-js"

const resend = new Resend(process.env.RESEND_API_KEY!)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const { email, titre, ville, quand, heure, prix, evenement_id, image_url, lat, lng, description } = await request.json()

    const siteUrl = process.env.NEXT_PUBLIC_URL || "https://sorties-app-seven.vercel.app"
    const lienEvenement = `${siteUrl}/evenement/${evenement_id}`
    const lienMaps = lat && lng
      ? `https://www.google.com/maps?q=${lat},${lng}`
      : `https://www.google.com/maps/search/${encodeURIComponent(ville)}`
    const dateFormatee = new Date(quand).toLocaleDateString("fr-FR", {
      weekday: "long", day: "numeric", month: "long", year: "numeric"
    })

    await supabase.from("rappels").insert({
      email,
      evenement_id,
      quand,
    })

    await resend.emails.send({
      from: "SortiesApp <onboarding@resend.dev>",
      to: email,
      subject: `🔔 Rappel activé — ${titre}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
          
          <!-- Image événement -->
          ${image_url ? `
          <a href="${lienEvenement}" style="display: block;">
            <img src="${image_url}" alt="${titre}" style="width: 100%; height: 220px; object-fit: cover; display: block;"/>
          </a>` : ""}

          <div style="padding: 24px;">
            <p style="color: #7c3aed; font-weight: bold; font-size: 13px; margin: 0 0 8px;">✅ Rappel activé !</p>
            <h2 style="margin: 0 0 16px; color: #111; font-size: 22px;">${titre}</h2>

            <!-- Infos -->
            <div style="background: #f9f7ff; border-radius: 12px; padding: 16px; margin-bottom: 16px;">
              <p style="margin: 6px 0; color: #444; font-size: 15px;">📅 <strong>${dateFormatee}${heure ? ` à ${heure}` : ""}</strong></p>
              <p style="margin: 6px 0; color: #444; font-size: 15px;">💶 <strong>${prix || "Gratuit"}</strong></p>
              ${description ? `<p style="margin: 12px 0 0; color: #666; font-size: 14px; line-height: 1.6;">${description.slice(0, 200)}${description.length > 200 ? "..." : ""}</p>` : ""}
            </div>

            <!-- Localisation cliquable -->
            <a href="${lienMaps}" target="_blank" style="display: flex; align-items: center; gap: 10px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 14px 16px; margin-bottom: 16px; text-decoration: none;">
              <span style="font-size: 24px;">📍</span>
              <div>
                <p style="margin: 0; color: #16a34a; font-weight: bold; font-size: 15px;">${ville}</p>
                <p style="margin: 2px 0 0; color: #4ade80; font-size: 12px;">Cliquer pour ouvrir dans Google Maps →</p>
              </div>
            </a>

            <!-- Boutons -->
            <div style="display: flex; gap: 12px; margin-bottom: 20px;">
              <a href="${lienEvenement}" style="flex: 1; background: #7c3aed; color: white; text-decoration: none; padding: 14px; border-radius: 12px; text-align: center; font-weight: bold; font-size: 15px; display: block;">
                Voir l'événement →
              </a>
              <a href="${lienMaps}" style="flex: 1; background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; text-decoration: none; padding: 14px; border-radius: 12px; text-align: center; font-weight: bold; font-size: 15px; display: block;">
                🗺️ Y aller
              </a>
            </div>

            <p style="color: #9ca3af; font-size: 13px; text-align: center; margin: 0;">
              Tu recevras un rappel la veille de l'événement.<br/>
              À très bientôt sur <strong>SortiesApp</strong> !
            </p>
          </div>
        </div>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error("ERREUR RAPPEL:", err?.message || err)
    return NextResponse.json({ error: "Erreur" }, { status: 500 })
  }
}