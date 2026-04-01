import { createClient } from "@supabase/supabase-js"
import EvenementDetail from "./evenement-client"

export async function generateMetadata({ params }: { params: { id: string } }) {
  try {
    const client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data } = await client
      .from("evenements")
      .select("titre,description,categorie,ville,image_url")
      .eq("id", params.id)
      .single()

    if (!data) return { title: "Événement | SortiesApp" }

    const title = `${data.titre} — ${data.ville}`
    const description = data.description || `Événement ${data.categorie} à ${data.ville}`
    const image = data.image_url || "https://sorties-app-seven.vercel.app/og-image.jpg"

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: [{ url: image, width: 1200, height: 630, alt: data.titre }],
        type: "article",
        locale: "fr_FR",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [image],
      },
    }
  } catch {
    return { title: "Événement | SortiesApp" }
  }
}

export default function Page({ params }: { params: { id: string } }) {
  return <EvenementDetail />
}