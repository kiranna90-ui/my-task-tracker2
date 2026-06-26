'use client'

import { CATEGORIES } from '@/lib/tracker/types'
import type { ModalInfo } from '@/lib/tracker/use-tracker'

export function CompletionModal({ modal, onClose }: { modal: ModalInfo; onClose: () => void }) {
  const isAll = modal.type === 'all'
  const category = CATEGORIES.find((c) => c.id === modal.category)

  const title = isAll ? 'Ты большая молодец!' : 'Раздел выполнен!'
  const emoji = isAll ? '🎉' : '🌟'
  const text = isAll
    ? 'Все задачи на сегодня выполнены. Можно выдохнуть, отдохнуть и похвалить себя ✨'
    : `Все ${category?.adjective ?? ''} задачи сегодня выполнены. Посмотри, что осталось сделать в других категориях.`

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-purple-deep/25 p-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <div
        className="glass-card w-full max-w-sm rounded-[2.25rem] p-7 text-center animate-pop-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white/70 text-4xl shadow-sm">
          <span aria-hidden="true">{emoji}</span>
        </div>
        <h3 className="text-2xl font-black text-ink">{title}</h3>
        <p className="mx-auto mt-3 max-w-xs text-balance text-sm font-bold text-muted-ink">{text}</p>
        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-2xl btn-gradient py-3.5 text-base font-extrabold text-white transition active:scale-95"
        >
          Хорошо
        </button>
      </div>
    </div>
  )
}
