import type { ReactNode } from 'react'
import CodeView from '@/components/code-view'

/**
 * Markdown-lite for prompts, hints and explanations: paragraphs, bullet lists,
 * fenced code blocks, `inline code`, **bold** and *italic*. Nothing else, no HTML.
 */

function inline(text: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = []
  const re = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*\s][^*]*\*)/g
  let last = 0
  let m: RegExpExecArray | null
  let i = 0
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index))
    const tok = m[0]
    const key = `${keyBase}-${i++}`
    if (tok.startsWith('`')) out.push(<code key={key}>{tok.slice(1, -1)}</code>)
    else if (tok.startsWith('**')) out.push(<strong key={key}>{tok.slice(2, -2)}</strong>)
    else out.push(<em key={key}>{tok.slice(1, -1)}</em>)
    last = m.index + tok.length
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}

export default function Markdown({ text, className = '', inline: asInline = false }: { text: string; className?: string; inline?: boolean }) {
  // Inline: one run of text inside a sentence, no paragraphs.
  if (asInline) return <span className={`prose-reps ${className}`}>{inline(text.replace(/\s*\n\s*/g, ' '), 'i')}</span>
  const blocks: ReactNode[] = []
  const lines = text.replace(/\r\n/g, '\n').split('\n')
  let para: string[] = []
  let list: string[] = []
  let k = 0

  const flushPara = () => {
    if (para.length) blocks.push(<p key={k++}>{inline(para.join(' '), `p${k}`)}</p>)
    para = []
  }
  const flushList = () => {
    if (list.length)
      blocks.push(
        <ul key={k++}>
          {list.map((li, i) => (
            <li key={i}>{inline(li, `l${k}-${i}`)}</li>
          ))}
        </ul>,
      )
    list = []
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line.trim().startsWith('```')) {
      flushPara()
      flushList()
      const code: string[] = []
      i++
      while (i < lines.length && !lines[i].trim().startsWith('```')) code.push(lines[i++])
      blocks.push(<CodeView key={k++} code={code.join('\n')} className="my-1" />)
      continue
    }
    if (/^\s*[-*] /.test(line)) {
      flushPara()
      list.push(line.replace(/^\s*[-*] /, ''))
      continue
    }
    if (!line.trim()) {
      flushPara()
      flushList()
      continue
    }
    flushList()
    para.push(line.trim())
  }
  flushPara()
  flushList()
  return <div className={`prose-reps ${className}`}>{blocks}</div>
}
