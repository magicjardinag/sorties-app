// ── Pool d'images Unsplash par catégorie ─────────────────────────────
// Plusieurs images par catégorie — une est choisie aléatoirement à chaque affichage
export const FALLBACK_PHOTOS_POOL: Record<string, string[]> = {
  "Musique": [
    "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&q=80",
    "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=600&q=80",
    "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&q=80",
    "https://images.unsplash.com/photo-1540039155733-5bb30b4f5bdc?w=600&q=80",
    "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=600&q=80",
    "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=600&q=80",
  ],
  "Sport": [
    "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80",
    "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=600&q=80",
    "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=600&q=80",
    "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=600&q=80",
    "https://images.unsplash.com/photo-1526676037777-05a232554f77?w=600&q=80",
    "https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=600&q=80",
  ],
  "Danse": [
    "https://images.unsplash.com/photo-1504609813442-a8924e83f76e?w=600&q=80",
    "https://images.unsplash.com/photo-1535525153412-5a42439a210d?w=600&q=80",
    "https://images.unsplash.com/photo-1508700929628-666bc8bd84ea?w=600&q=80",
    "https://images.unsplash.com/photo-1547153760-18fc86324498?w=600&q=80",
    "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&q=80",
  ],
  "Culture": [
    "https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=600&q=80",
    "https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=600&q=80",
    "https://images.unsplash.com/photo-1554907984-15263bfd63bd?w=600&q=80",
    "https://images.unsplash.com/photo-1536924940846-227afb31e2a5?w=600&q=80",
    "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=600&q=80",
    "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&q=80",
  ],
  "Atelier": [
    "https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=600&q=80",
    "https://images.unsplash.com/photo-1459183885421-5cc683b8dbba?w=600&q=80",
    "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&q=80",
    "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=600&q=80",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80",
  ],
  "Food": [
    "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&q=80",
    "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80",
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80",
    "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&q=80",
    "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=600&q=80",
    "https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?w=600&q=80",
  ],
  "Nature & Rando": [
    "https://images.unsplash.com/photo-1551632811-561732d1e306?w=600&q=80",
    "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&q=80",
    "https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?w=600&q=80",
    "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=600&q=80",
    "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=600&q=80",
    "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=600&q=80",
  ],
  "Animaux": [
    "https://images.unsplash.com/photo-1425082661705-1834bfd09dca?w=600&q=80",
    "https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=600&q=80",
    "https://images.unsplash.com/photo-1444212477490-ca407925329e?w=600&q=80",
    "https://images.unsplash.com/photo-1518155317743-a8ff43ea6a5f?w=600&q=80",
    "https://images.unsplash.com/photo-1437622368342-7a3d73a34c8f?w=600&q=80",
  ],
  "Brocante": [
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80",
    "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=600&q=80",
    "https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=600&q=80",
    "https://images.unsplash.com/photo-1567767292278-a3e6b3dba866?w=600&q=80",
    "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=600&q=80",
  ],
  "Bar & Nuit": [
    "https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?w=600&q=80",
    "https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=600&q=80",
    "https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=600&q=80",
    "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=600&q=80",
    "https://images.unsplash.com/photo-1543007630-9710e4a00a20?w=600&q=80",
    "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=600&q=80",
  ],
  "Loto": [
    "https://images.unsplash.com/photo-1642543492481-44e81e3914a7?w=600&q=80",
    "https://images.unsplash.com/photo-1518895312237-a9e23508077d?w=600&q=80",
    "https://images.unsplash.com/photo-1547226706-6f51c0a87af9?w=600&q=80",
  ],
  "Enfants": [
    "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=600&q=80",
    "https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=600&q=80",
    "https://images.unsplash.com/photo-1489710437720-ebb67ec84dd2?w=600&q=80",
    "https://images.unsplash.com/photo-1471286174890-9c112ffca5b4?w=600&q=80",
    "https://images.unsplash.com/photo-1543946207-39bd91e70ca7?w=600&q=80",
  ],
  "Gratuit": [
    "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&q=80",
    "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=600&q=80",
    "https://images.unsplash.com/photo-1519750783826-e2420f4d687f?w=600&q=80",
    "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=600&q=80",
  ],
}

// Retourne une image aléatoire du pool pour la catégorie
// Utilise l'id de l'événement comme seed pour que la même image
// soit toujours affichée pour le même événement
export function getFallbackPhoto(categorie: string, seed?: string): string {
  const pool = FALLBACK_PHOTOS_POOL[categorie] || FALLBACK_PHOTOS_POOL["Gratuit"]
  if (!seed) return pool[Math.floor(Math.random() * pool.length)]
  // Seed déterministe basé sur l'id → même image à chaque rendu
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i)
    hash |= 0
  }
  return pool[Math.abs(hash) % pool.length]
}
