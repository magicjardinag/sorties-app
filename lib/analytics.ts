import { supabase } from "./supabase"

type EventType =
  | "vue_evenement"
  | "clic_participer"
  | "ajout_calendrier"
  | "ajout_favori"
  | "retrait_favori"
  | "clic_partage"
  | "vue_pub"
  | "clic_pub"
  | "clic_code_promo"
  | "vue_evenement" | "clic_participer" | "ajout_calendrier"
  | "ajout_favori" | "retrait_favori" | "clic_partage"
  | "vue_pub" | "clic_pub" | "clic_code_promo"
  | "scan_qr" | "install_app" | "geo_activee"
  | "filtre_categorie" | "filtre_date" | "recherche" | "clic_carte"

export async function track(
  type: EventType,
  ref_id?: string,
  meta?: Record<string, any>
) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from("analytics_events").insert({
      type,
      ref_id: ref_id || null,
      user_id: user?.id || null,
      meta: meta || null,
    })
  } catch (e) {
    // silencieux — on ne bloque jamais l'UI pour un tracking raté
  }
}