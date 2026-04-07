import { NextResponse } from "next/server"
import { Resend } from "resend"
import { createClient } from "@supabase/supabase-js"

const resend = new Resend(process.env.RESEND_API_KEY!)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Appeler chaque jour via Vercel Cron ou un service externe
export async function GET(request: Request) {
  // Vérification sécurité
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  try {
    const today = new Date().toISOString().split("T")[0]

    // Récupérer tous les rappels à envoyer aujourd'hui
    const { data: rappels } = await supabase
      .from("rappels")
      .select("*, evenements(*)")
      .eq("date_envoi", today)
      .eq("envoye", false)

    if (!rappels || rappels.length === 0) {
      return NextResponse.json({ success: true, sent: 0 })
    }

    let sent = 0

    for (const rappel of rappels) {
      const ev = rappel.evenements
      if (!ev) continue

      const siteUrl = process.env.NEXT_PUBLIC_URL || "https://sorties-app-seven.vercel.app"
      const lienEvenement = `${siteUrl}/evenement/${ev.id}`
      const lienMaps = ev.lat && ev.lng
        ? `https://www.google.com/maps?q=${ev.lat},${ev.lng}`
        : `https://www.google.com/maps/search/${encodeURIComponent(ev.ville)}`
      const dateFormatee = new Date(ev.quand).toLocaleDateString("fr-FR", {
        weekday: "long", day: "numeric", month: "long", year: "numeric"
      })
      const delaiTexte = rappel.jours_avant === 1 ? "demain" : rappel.jours_avant === 3 ? "dans 3 jours" : "dans 7 jours"

      try {
        await resend.emails.send({
          from: "SortiesApp <onboarding@resend.dev>",
          to: rappel.email,
          subject: `🔔 Rappel — ${ev.titre} ${delaiTexte} !`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
              ${ev.image_url ? `<a href="${lienEvenement}"><img src="${ev.image_url}" alt="${ev.titre}" style="width: 100%; height: 220px; object-fit: cover; display: block;"/></a>` : ""}
              <div style="padding: 24px;">
                <p style="color: #FF4D00; font-weight: bold; font-size: 13px; margin: 0 0 8px;">⏰ C'est ${delaiTexte} !</p>
                <h2 style="margin: 0 0 16px; color: #111; font-size: 22px;">${ev.titre}</h2>
                <div style="background: #FFF7ED; border-radius: 12px; padding: 16px; margin-bottom: 16px; border: 1px solid #FED7AA;">
                  <p style="margin: 6px 0; color: #444; font-size: 15px;">📅 <strong>${dateFormatee}${ev.heure ? ` à ${ev.heure}` : ""}</strong></p>
                  <p style="margin: 6px 0; color: #444; font-size: 15px;">💶 <strong>${ev.prix || "Gratuit"}</strong></p>
                </div>
                <a href="${lienMaps}" target="_blank" style="display: flex; align-items: center; gap: 10px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 14px 16px; margin-bottom: 16px; text-decoration: none;">
                  <span style="font-size: 24px;">📍</span>
                  <div>
                    <p style="margin: 0; color: #16a34a; font-weight: bold;">${ev.ville}</p>
                    <p style="margin: 2px 0 0; color: #4ade80; font-size: 12px;">Voir sur Google Maps →</p>
                  </div>
                </a>
                <a href="${lienEvenement}" style="display: block; background: #FF4D00; color: white; text-decoration: none; padding: 16px; border-radius: 12px; text-align: center; font-weight: bold; font-size: 16px; margin-bottom: 16px;">
                  🎉 Je suis prêt ! Voir l'événement →
                </a>
                <p style="color: #9ca3af; font-size: 13px; text-align: center;">À très bientôt sur <strong>SortiesApp</strong> !</p>
              </div>
            </div>
          `,
        })

        // Marquer comme envoyé
        await supabase.from("rappels").update({ envoye: true }).eq("id", rappel.id)
        sent++
      } catch (e) {
        console.error(`Erreur envoi rappel ${rappel.id}:`, e)
      }
    }

    return NextResponse.json({ success: true, sent, total: rappels.length })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 })
  }
}