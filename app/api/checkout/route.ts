import { NextResponse } from "next/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST() {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "eur",
          product_data: {
            name: "Publication d'un événement",
            description: "Publiez votre événement sur SortiesApp",
          },
          unit_amount: 990,
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: "http://localhost:3000/publier/success",
    cancel_url: "http://localhost:3000/publier",
  })

  return NextResponse.json({ url: session.url })
}