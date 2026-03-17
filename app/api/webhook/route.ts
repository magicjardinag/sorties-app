import { NextResponse } from "next/server"
import Stripe from "stripe"
import { createClient } from "@supabase/supabase-js"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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

    const emojis: Record<string, string> = {
      Musique: "🎵",
      Sport: "🏃",
      Culture: "🎨",
      Food: "🍕",
      Nature: "🌿",
      Autre: "🎉",
    }

    const couleurs: Record<string, string> = {
      Musique: "bg-purple-100",
      Sport: "bg-green-100",
      Culture: "bg-orange-100",
      Food: "bg-yellow-100",
      Nature: "bg-emerald-100",
      Autre: "bg-blue-100",
    }

    await supabase.from("evenements").insert({
      titre,
      categorie,
      ville,
      quand: date,
      heure,
      prix,
      description,
      emoji: emojis[categorie] || "🎉",
      couleur: couleurs[categorie] || "bg-blue-100",
      organisateur: session.customer_details?.email || "Organisateur",
      user_id: session.metadata?.user_id || null,
    })
  }

  return NextResponse.json({ received: true })
}