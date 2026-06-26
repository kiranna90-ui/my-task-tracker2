import { Heart, Sparkle } from 'lucide-react'

// Soft decorative glow + a few cute symbols around the hero area.
export function HeroDecorations() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* glow blobs */}
      <div className="absolute -left-10 top-20 h-40 w-40 rounded-full bg-pink-soft/45 blur-2xl" />
      <div className="absolute right-0 top-28 h-52 w-52 rounded-full bg-lavender/50 blur-2xl" />
      <div className="absolute left-1/2 top-48 h-40 w-40 -translate-x-1/2 rounded-full bg-peach/30 blur-2xl" />

      {/* symbols */}
      <Sparkle className="absolute right-8 top-6 h-6 w-6 fill-white/90 text-white/90 animate-float" />
      <Sparkle
        className="absolute right-14 top-40 h-4 w-4 fill-white/80 text-white/80 animate-float"
        style={{ animationDelay: '1.2s' }}
      />
      {/* One clean accent on the left side instead of two separate round elements */}
      <Heart
        className="absolute left-10 top-36 h-6 w-6 fill-white/85 text-white/85 animate-float"
        style={{ animationDelay: '0.6s' }}
      />
      <Heart
        className="absolute right-10 top-52 h-5 w-5 fill-pink text-pink animate-float"
        style={{ animationDelay: '1.6s' }}
      />
    </div>
  )
}
