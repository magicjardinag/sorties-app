import { NextResponse } from "next/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: Request) {
  const body = await request.json()
  const { titre, categorie, ville, codePostal, lat, lng, date, heure, prix, description } = body

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "eur",
          product_data: {
            name: "Publication d'un événement",
            description: `${titre} - ${ville}`,
          },
          unit_amount: 990,
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `${process.env.NEXT_PUBLIC_URL}/publier/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/publier`,
    metadata: {
      titre,
      categorie,
      ville,
      codePostal: codePostal || "",
      lat: lat?.toString() || "0",
      lng: lng?.toString() || "0",
      date,
      heure,
      prix: prix || "Gratuit",
      description,
    },
  })

  return NextResponse.json({ url: session.url })
}