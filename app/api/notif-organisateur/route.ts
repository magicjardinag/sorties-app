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
    const { evenement_id, titre, ville, quand, participant_email } = await request.json()

    // Récupérer le user_id de l'organisateur
    const { data: evenement } = await supabase
      .from("evenements")
      .select("user_id, organisateur")
      .eq("id", evenement_id)
      .single()

    if (!evenement?.user_id) return NextResponse.json({ success: false })

    // Récupérer l'email de l'organisateur via Auth
    const { data: userData } = await supabase.auth.admin.getUserById(evenement.user_id)
    const emailOrganisateur = userData?.user?.email

    if (!emailOrganisateur) return NextResponse.json({ success: false })

    // Compter le nombre total de participants
    const { count } = await supabase
      .from("participations")
      .select("id", { count: "exact" })
      .eq("evenement_id", evenement_id)

    const dateFormatee = new Date(quand).toLocaleDateString("fr-FR", {
      weekday: "long", day: "numeric", month: "long", year: "numeric"
    })

    const siteUrl = process.env.NEXT_PUBLIC_URL || "https://sorties-app-seven.vercel.app"

    await resend.emails.send({
      from: "SortiesApp <onboarding@resend.dev>",
      to: emailOrganisateur,
      subject: `🎉 Nouveau participant — ${titre}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
          <div style="background: linear-gradient(135deg, #FF4D00, #FF8C42); padding: 24px; text-align: center;">
            <p style="color: white; font-size: 40px; margin: 0;">🎉</p>
            <h2 style="color: white; margin: 8px 0 0; font-size: 22px;">Nouveau participant !</h2>
          </div>
          <div style="padding: 24px;">
            <p style="color: #374151; font-size: 15px; margin: 0 0 16px;">
              Quelqu'un vient de s'inscrire à ton événement <strong>${titre}</strong>.
            </p>

            <div style="background: #FFF7ED; border-radius: 12px; padding: 16px; margin-bottom: 16px; border: 1px solid #FED7AA;">
              <p style="margin: 4px 0; color: #444; font-size: 14px;">📧 <strong>${participant_email}</strong></p>
              <p style="margin: 4px 0; color: #444; font-size: 14px;">📅 ${dateFormatee}</p>
              <p style="margin: 4px 0; color: #444; font-size: 14px;">📍 ${ville}</p>
            </div>

            <div style="background: #F0FDF4; border-radius: 12px; padding: 16px; margin-bottom: 20px; text-align: center; border: 1px solid #BBF7D0;">
              <p style="color: #16a34a; font-size: 28px; font-weight: bold; margin: 0;">${count}</p>
              <p style="color: #16a34a; font-size: 14px; margin: 4px 0 0;">participant${(count || 0) > 1 ? "s" : ""} au total</p>
            </div>

            <a href="${siteUrl}/dashboard" style="display: block; background: #FF4D00; color: white; text-decoration: none; padding: 16px; border-radius: 12px; text-align: center; font-weight: bold; font-size: 15px; margin-bottom: 16px;">
              Voir mes statistiques →
            </a>

            <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
              SortiesApp — Gérez vos événements depuis votre espace personnel
            </p>
          </div>
        </div>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error("ERREUR NOTIF ORGA:", err?.message || err)
    return NextResponse.json({ error: "Erreur" }, { status: 500 })
  }
}