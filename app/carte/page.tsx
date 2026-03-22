import { Suspense } from "react"
import CarteClient from "./CarteClient"

export default function Carte() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen text-gray-400">Chargement...</div>}>
      <CarteClient />
    </Suspense>
  )
}