import { Fragment, type ReactNode } from 'react'
import { classHighlighter, highlightCode } from '@lezer/highlight'
import { parser } from '@lezer/python'

/** Read-only Python with static highlighting. No editor, no runtime cost. */

export function highlightPython(code: string): ReactNode[] {
  const out: ReactNode[] = []
  let k = 0
  highlightCode(
    code,
    parser.parse(code),
    classHighlighter,
    (text, classes) => out.push(classes ? <span key={k++} className={classes}>{text}</span> : <Fragment key={k++}>{text}</Fragment>),
    () => out.push(<Fragment key={k++}>{'\n'}</Fragment>),
  )
  return out
}

export default function CodeView({ code, className = '', label }: { code: string; className?: string; label?: string }) {
  return (
    <pre className={`code-view ${className}`} aria-label={label ?? 'Code'}>
      <code>{highlightPython(code.replace(/\n+$/, ''))}</code>
    </pre>
  )
}
