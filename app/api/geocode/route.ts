import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST() {
  try {
    // Récupérer tous les événements sans coordonnées
    const { data: events } = await supabase
      .from("evenements")
      .select("id, ville")
      .or("lat.is.null,lng.is.null,lat.eq.0,lng.eq.0")

    if (!events || events.length === 0) {
      return NextResponse.json({ success: true, geocoded: 0, message: "Tous les événements sont déjà géocodés !" })
    }

    let geocoded = 0
    let errors = 0

    for (const ev of events) {
      try {
        const res = await fetch(
          `https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(ev.ville)}&fields=nom,centre&limit=1`
        )
        const data = await res.json()

        if (data.length > 0 && data[0].centre) {
          const lat = data[0].centre.coordinates[1]
          const lng = data[0].centre.coordinates[0]

          await supabase
            .from("evenements")
            .update({ lat, lng })
            .eq("id", ev.id)

          geocoded++
        } else {
          errors++
        }

        // Petite pause pour ne pas surcharger l'API
        await new Promise(r => setTimeout(r, 80))
      } catch {
        errors++
      }
    }

    return NextResponse.json({
      success: true,
      geocoded,
      errors,
      total: events.length,
      message: `${geocoded} événements géocodés sur ${events.length}`
    })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 })
  }
}