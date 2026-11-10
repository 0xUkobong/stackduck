import { X, Mail } from 'lucide-react'
import DiscordIcon from './DiscordIcon'
import XIcon from './XIcon'
import { useDialog } from '../lib/useDialog'

export default function DeveloperModal({ onClose }: { onClose: () => void }) {
  const dialogRef = useDialog(onClose)
  return (
    <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-backdrop p-4" onClick={onClose} role="presentation">
      <div ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="dev-heading" aria-describedby="dev-note dev-description" className="modal-pop relative max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-2xl border border-line bg-elevated p-6 text-center shadow-sm-2 sm:p-8" onClick={event => event.stopPropagation()}>
        <button onClick={onClose} aria-label="Close developer profile" className="icon-button absolute right-2 top-2"><X size={18} aria-hidden="true" /></button>
        <img src="/0x_Sigmoid_avatar.png" alt="0xUkobong avatar" width={88} height={88} className="mx-auto mt-2 size-[88px] rounded-full border border-line bg-inset object-cover" />
        <h2 id="dev-heading" className="mt-5 font-display text-2xl font-semibold">@0xUkobong</h2>
        <p className="mt-1 text-sm font-semibold text-ink-muted">Developer</p>
        <p id="dev-note" className="mt-5 text-sm leading-relaxed text-ink-muted">Stackduck is designed and built by @0xUkobong — an indie developer who got tired of touring a dozen admin panels every morning and decided to fix it for good.</p>
        <p id="dev-description" className="mt-6 text-sm font-semibold">Follow the journey or say hello.</p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <a href="https://x.com/StackduckApp" target="_blank" rel="noreferrer" className="btn-ghost" aria-label="@StackduckApp on X"><XIcon />X</a>
          <a href="https://discord.gg/stackduck" target="_blank" rel="noreferrer" className="btn-ghost"><DiscordIcon />Discord</a>
        </div>
        <a href="mailto:talk2sigmoid@gmail.com" className="btn-ghost mt-3 w-full break-all"><Mail size={16} aria-hidden="true" />talk2sigmoid@gmail.com</a>
      </div>
    </div>
  )
}
