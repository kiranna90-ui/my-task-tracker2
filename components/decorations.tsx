import { Cloud, Heart, Sparkle, Star } from 'lucide-react'

// Soft decorative blobs + cute symbols floating around the hero area.
export function HeroDecorations() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* glow blobs */}
      <div className="absolute -left-10 top-16 h-44 w-44 rounded-full bg-pink-soft/60 blur-2xl" />
      <div className="absolute right-0 top-28 h-52 w-52 rounded-full bg-lavender/50 blur-2xl" />
      <div className="absolute left-1/2 top-48 h-40 w-40 -translate-x-1/2 rounded-full bg-peach/40 blur-2xl" />

      {/* symbols */}
      <Sparkle className="absolute right-8 top-6 h-6 w-6 fill-white/90 text-white/90 animate-float" />
      <Sparkle
        className="absolute right-14 top-40 h-4 w-4 fill-white/80 text-white/80 animate-float"
        style={{ animationDelay: '1.2s' }}
      />
      <Cloud
        className="absolute left-10 top-20 h-7 w-7 fill-white/80 text-white/80 animate-float"
        style={{ animationDelay: '0.6s' }}
      />
      <Heart
        className="absolute left-8 top-44 h-5 w-5 fill-white/85 text-white/85 animate-float"
        style={{ animationDelay: '0.9s' }}
      />
      <Heart
        className="absolute right-10 top-52 h-5 w-5 fill-pink text-pink animate-float"
        style={{ animationDelay: '1.6s' }}
      />
      <Star
        className="absolute left-20 top-8 h-4 w-4 fill-white/70 text-white/70 animate-float"
        style={{ animationDelay: '0.3s' }}
      />
    </div>
  )
}
