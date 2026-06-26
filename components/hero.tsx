import Image from 'next/image'
import { HeroDecorations } from './decorations'

export function Hero() {
  return (
    <header className="relative pt-6">
      <HeroDecorations />

      {/* Top pill label */}
      <div className="relative z-10 flex justify-center">
        <span className="rounded-full bg-white/70 px-6 py-2 text-sm font-extrabold uppercase tracking-[0.2em] text-purple shadow-sm backdrop-blur">
          My Task Tracker
        </span>
      </div>

      {/* Character illustration, sitting low so she leans over the card below */}
      <div className="relative z-10 -mb-10 mt-2 flex justify-center">
        <Image
          src="/images/supergirl.png"
          alt="Милый персонаж с телефоном — талисман трекера задач"
          width={380}
          height={425}
          priority
          className="h-auto w-[300px] select-none drop-shadow-[0_18px_30px_rgba(150,90,180,0.25)] sm:w-[330px]"
        />
      </div>
    </header>
  )
}
