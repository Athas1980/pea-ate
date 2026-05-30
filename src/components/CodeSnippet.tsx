import Prism from 'prismjs'
import 'prismjs/components/prism-lua'

interface Props {
  code: string
  label?: string
  onCopy?: () => void
  copied?: boolean
}

export default function CodeSnippet({ code, label, onCopy, copied }: Props) {
  const html = Prism.highlight(code, Prism.languages.lua, 'lua')

  return (
    <div className="flex flex-col gap-1">
      {(label || onCopy) && (
        <div className="flex items-center justify-between">
          {label && <span className="text-[var(--p8-dark-grey)]">{label}</span>}
          {onCopy && (
            <button
              onClick={onCopy}
              className={copied ? 'text-[var(--p8-green)]' : 'text-[var(--p8-light-grey)] hover:text-[var(--p8-white)]'}
            >{copied ? 'copied!' : 'copy'}</button>
          )}
        </div>
      )}
      <pre
        className="text-[10px] text-[var(--p8-light-grey)] leading-relaxed whitespace-pre-wrap p-2 border-2 border-[var(--p8-dark-grey)] code-snippet"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  )
}
