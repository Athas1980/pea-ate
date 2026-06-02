import Prism from 'prismjs'
import 'prismjs/components/prism-lua'

// Pico-8 built-in functions — highlight as keywords
Prism.languages.lua = {
  ...Prism.languages.lua,
  'keyword': /\b(?:poke|poke4|peek|peek4|pal|palt|pset|pget|spr|sspr|map|mget|mset|fget|fset|btn|btnp|sfx|music|stat|time|cls|camera|circ|circfill|line|rect|rectfill|print|cursor|color|flip|memcpy|memset|reload|cstore|cartdata|dget|dset|tonum|tostr|sub|split|add|del|all|pairs|ipairs|type|unpack|rawget|rawset|setmetatable|getmetatable|next|select|load|run|stop|printh|extcmd|and|break|do|else|elseif|end|false|for|function|goto|if|in|local|nil|not|or|repeat|return|then|true|until|while)\b/,
}

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
          {label && <span className="text-[var(--p8-light-grey)]">{label}</span>}
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
