import { NextResponse } from "next/server"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY!)

const ADMIN_EMAIL = "magicjardinag@gmail.com"

const sujetsLabels: Record<string, string> = {
  question: "Question générale",
  annulation: "Annulation d'un événement",
  remboursement: "Demande de remboursement",
  signalement: "Signaler un événement",
  partenariat: "Partenariat / Publicité",
  technique: "Problème technique",
  autre: "Autre",
}

export async function POST(request: Request) {
  const { nom, email, sujet, message } = await request.json()

  try {
    // Email à toi
    await resend.emails.send({
      from: "SortiesApp <onboarding@resend.dev>",
      to: ADMIN_EMAIL,
      subject: `📩 Nouveau message - ${sujetsLabels[sujet] || sujet}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #7c3aed;">Nouveau message de contact</h2>
          <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p><strong>Nom :</strong> ${nom}</p>
            <p><strong>Email :</strong> ${email}</p>
            <p><strong>Sujet :</strong> ${sujetsLabels[sujet] || sujet}</p>
            <p><strong>Message :</strong></p>
            <p style="background: white; padding: 12px; border-radius: 6px;">${message}</p>
          </div>
          <p style="color: #6b7280; font-size: 14px;">Réponds directement à cet email pour contacter ${nom}.</p>
        </div>
      `,
      replyTo: email,
    })

    // Email de confirmation à l'utilisateur
    await resend.emails.send({
      from: "SortiesApp <onboarding@resend.dev>",
      to: email,
      subject: "Nous avons bien reçu ton message ✅",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #7c3aed;">Bonjour ${nom} !</h2>
          <p>Nous avons bien reçu ton message concernant : <strong>${sujetsLabels[sujet] || sujet}</strong></p>
          <p>Notre équipe te répondra dans les plus brefs délais, généralement sous 24h.</p>
          <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p style="color: #6b7280; font-size: 14px;"><strong>Ton message :</strong></p>
            <p style="color: #374151;">${message}</p>
          </div>
          <p>À bientôt sur SortiesApp !</p>
          <p style="color: #6b7280; font-size: 14px;">L'équipe SortiesApp</p>
        </div>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Erreur envoi email" }, { status: 500 })
  }
}