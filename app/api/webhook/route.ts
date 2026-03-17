import { NextResponse } from "next/server"
import Stripe from "stripe"
import { createClient } from "@supabase/supabase-js"
import { Resend } from "resend"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
const resend = new Resend(process.env.RESEND_API_KEY!)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const ADMIN_EMAIL = "magicjardinag@gmail.com"

export async function POST(request: Request) {
  const body = await request.text()
  const sig = request.headers.get("stripe-signature")!

  let event

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    return NextResponse.json({ error: "Webhook error" }, { status: 400 })
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as any
    const { titre, categorie, ville, date, heure, prix, description } = session.metadata
    const organisateurEmail = session.customer_details?.email || ""

    const emojis: Record<string, string> = {
      Musique: "🎵", Sport: "🏃", Culture: "🎨",
      Food: "🍕", Nature: "🌿", Autre: "🎉",
    }
    const couleurs: Record<string, string> = {
      Musique: "bg-purple-100", Sport: "bg-green-100", Culture: "bg-orange-100",
      Food: "bg-yellow-100", Nature: "bg-emerald-100", Autre: "bg-blue-100",
    }

    const { data: evenement } = await supabase.from("evenements").insert({
      titre, categorie, ville,
      quand: date, heure, prix, description,
      emoji: emojis[categorie] || "🎉",
      couleur: couleurs[categorie] || "bg-blue-100",
      organisateur: organisateurEmail,
      user_id: session.metadata?.user_id || null,
      statut: "en_attente",
    }).select().single()

    // Email à l'admin
    await resend.emails.send({
      from: "SortiesApp <onboarding@resend.dev>",
      to: ADMIN_EMAIL,
      subject: `🔔 Nouvel événement en attente - ${titre}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #7c3aed;">Nouvel événement en attente de modération</h2>
          <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p><strong>Titre :</strong> ${titre}</p>
            <p><strong>Catégorie :</strong> ${categorie}</p>
            <p><strong>Ville :</strong> ${ville}</p>
            <p><strong>Date :</strong> ${date} à ${heure}</p>
            <p><strong>Prix :</strong> ${prix || "Gratuit"}</p>
            <p><strong>Organisateur :</strong> ${organisateurEmail}</p>
            <p><strong>Description :</strong> ${description}</p>
          </div>
          <a href="${process.env.NEXT_PUBLIC_URL}/admin" style="background: #7c3aed; color: white; padding: 12px 24px; border-radius: 24px; text-decoration: none; display: inline-block;">
            Modérer l'événement →
          </a>
        </div>
      `,
    })
  }

  return NextResponse.json({ received: true })
}

