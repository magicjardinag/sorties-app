import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY!)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  const { id, statut, organisateur, titre } = await request.json()

  await supabase.from("evenements").update({ statut }).eq("id", id)

  if (statut === "approuve") {
    await resend.emails.send({
      from: "SortiesApp <onboarding@resend.dev>",
      to: organisateur,
      subject: `🎉 Votre événement "${titre}" est en ligne !`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #7c3aed;">Félicitations ! 🎉</h2>
          <p>Votre événement <strong>${titre}</strong> a été approuvé et est maintenant visible sur SortiesApp.</p>
          <p>Les utilisateurs peuvent désormais le découvrir et y participer !</p>
          <a href="${process.env.NEXT_PUBLIC_URL}" style="background: #7c3aed; color: white; padding: 12px 24px; border-radius: 24px; text-decoration: none; display: inline-block; margin-top: 16px;">
            Voir mon événement →
          </a>
          <p style="color: #6b7280; margin-top: 24px; font-size: 14px;">L'équipe SortiesApp</p>
        </div>
      `,
    })
  }

  if (statut === "refuse") {
    await resend.emails.send({
      from: "SortiesApp <onboarding@resend.dev>",
      to: organisateur,
      subject: `Votre événement "${titre}" n'a pas été retenu`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #374151;">Nous sommes désolés</h2>
          <p>Après examen, votre événement <strong>${titre}</strong> ne correspond pas aux critères de publication de SortiesApp.</p>
          <p>Voici quelques raisons possibles :</p>
          <ul style="color: #6b7280;">
            <li>Les informations fournies sont insuffisantes</li>
            <li>L'événement ne correspond pas à nos catégories</li>
            <li>Le contenu ne respecte pas nos conditions d'utilisation</li>
          </ul>
          <p>Vous pouvez soumettre un nouvel événement en vous assurant que toutes les informations sont complètes et précises.</p>
          <a href="${process.env.NEXT_PUBLIC_URL}/publier" style="background: #7c3aed; color: white; padding: 12px 24px; border-radius: 24px; text-decoration: none; display: inline-block; margin-top: 16px;">
            Soumettre un nouvel événement →
          </a>
          <p style="color: #6b7280; margin-top: 24px; font-size: 14px;">L'équipe SortiesApp</p>
        </div>
      `,
    })
  }

  return NextResponse.json({ success: true })
}