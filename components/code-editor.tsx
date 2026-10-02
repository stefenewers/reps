'use client'

import { useEffect, useRef } from 'react'
import { EditorState, Compartment, type Extension } from '@codemirror/state'
import {
  EditorView,
  keymap,
  lineNumbers,
  highlightActiveLine,
  highlightActiveLineGutter,
  drawSelection,
  placeholder as placeholderExt,
} from '@codemirror/view'
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands'
import { bracketMatching, indentOnInput, indentUnit, syntaxHighlighting, HighlightStyle } from '@codemirror/language'
import { autocompletion, closeBrackets, closeBracketsKeymap, completionKeymap } from '@codemirror/autocomplete'
import { python } from '@codemirror/lang-python'
import { tags } from '@lezer/highlight'

/**
 * The Python editor. Light, quiet, monospaced. Cmd/Ctrl+Enter runs,
 * Shift+Cmd/Ctrl+Enter submits. Tab indents; Escape then Tab leaves the editor.
 * In Interview mode autocomplete and auto-closing brackets are off.
 */

const style = HighlightStyle.define([
  { tag: tags.keyword, color: '#a626a4' },
  { tag: [tags.string, tags.special(tags.string)], color: '#2a7a3b' },
  { tag: [tags.number, tags.bool, tags.null], color: '#b4530d' },
  { tag: tags.comment, color: '#9c9ca3', fontStyle: 'italic' },
  { tag: tags.definition(tags.variableName), color: '#2f5bd3' },
  { tag: tags.function(tags.definition(tags.variableName)), color: '#2f5bd3' },
  { tag: tags.className, color: '#0e7490' },
  { tag: tags.propertyName, color: '#2b2b2e' },
])

const theme = EditorView.theme({
  '&': { fontSize: '14px', height: '100%', backgroundColor: '#fbfbfc' },
  '.cm-scroller': { fontFamily: 'var(--font-geist-mono), ui-monospace, monospace', lineHeight: '1.7' },
  '.cm-content': { padding: '16px 0', caretColor: '#0b0b0c' },
  '.cm-cursor': { borderLeftWidth: '2px', borderLeftColor: '#0b0b0c' },
  '.cm-gutters': { backgroundColor: '#fbfbfc', border: 'none', color: '#c6c6cc' },
  '.cm-lineNumbers .cm-gutterElement': { padding: '0 14px 0 18px', minWidth: '44px' },
  '.cm-activeLine': { backgroundColor: 'rgba(15,15,20,0.028)' },
  '.cm-activeLineGutter': { backgroundColor: 'transparent', color: '#66666d' },
  '&.cm-focused': { outline: 'none' },
  '.cm-selectionBackground, &.cm-focused .cm-selectionBackground, ::selection': { backgroundColor: '#dfe6fb !important' },
  '.cm-matchingBracket': { backgroundColor: '#eef2fd', outline: 'none' },
  '.cm-placeholder': { color: '#b4b4ba' },
  '.cm-tooltip': { border: '1px solid #dcdce0', borderRadius: '6px', backgroundColor: '#fff' },
  '.cm-errorLine': { backgroundColor: '#fdf1f0' },
})

export interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
  onRun?: () => void
  onSubmit?: () => void
  assist?: boolean
  readOnly?: boolean
  ariaLabel?: string
  placeholder?: string
  autoFocus?: boolean
  minHeight?: number
  /** Bump to move focus into the editor (e.g. "Back to code"). */
  focusToken?: number
}

export default function CodeEditor({ value, onChange, onRun, onSubmit, assist = true, readOnly = false, ariaLabel = 'Python editor', placeholder, autoFocus, minHeight = 220, focusToken }: CodeEditorProps) {
  const host = useRef<HTMLDivElement>(null)
  const view = useRef<EditorView | null>(null)
  const assistC = useRef(new Compartment())
  const readOnlyC = useRef(new Compartment())
  const handlers = useRef({ onChange, onRun, onSubmit })
  useEffect(() => {
    handlers.current = { onChange, onRun, onSubmit }
  })

  useEffect(() => {
    if (!host.current) return
    const assistExt = (on: boolean): Extension => (on ? [autocompletion({ activateOnTyping: true }), closeBrackets(), keymap.of([...closeBracketsKeymap, ...completionKeymap])] : [])
    const state = EditorState.create({
      doc: value,
      extensions: [
        lineNumbers(),
        highlightActiveLineGutter(),
        highlightActiveLine(),
        history(),
        drawSelection(),
        indentOnInput(),
        bracketMatching(),
        indentUnit.of('    '),
        EditorState.tabSize.of(4),
        python(),
        syntaxHighlighting(style),
        theme,
        placeholder ? placeholderExt(placeholder) : [],
        assistC.current.of(assistExt(assist)),
        readOnlyC.current.of(EditorState.readOnly.of(readOnly)),
        keymap.of([
          { key: 'Mod-Enter', run: () => (handlers.current.onRun?.(), true) },
          { key: 'Shift-Mod-Enter', run: () => (handlers.current.onSubmit?.(), true) },
          indentWithTab,
          ...defaultKeymap,
          ...historyKeymap,
        ]),
        EditorView.updateListener.of((u) => {
          if (u.docChanged) handlers.current.onChange(u.state.doc.toString())
        }),
        EditorView.contentAttributes.of({ 'aria-label': ariaLabel, 'aria-multiline': 'true', spellcheck: 'false', autocorrect: 'off', autocapitalize: 'off' }),
      ],
    })
    const v = new EditorView({ state, parent: host.current })
    view.current = v
    if (autoFocus) v.focus()
    ;(assistC.current as Compartment & { make?: typeof assistExt }).make = assistExt
    return () => {
      v.destroy()
      view.current = null
    }
    // The editor is created once; props below are synced by the other effects.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // External resets (Run it back, Reset) replace the document.
  useEffect(() => {
    const v = view.current
    if (v && v.state.doc.toString() !== value) v.dispatch({ changes: { from: 0, to: v.state.doc.length, insert: value } })
  }, [value])

  useEffect(() => {
    const v = view.current
    const c = assistC.current as Compartment & { make?: (on: boolean) => Extension }
    if (v && c.make) v.dispatch({ effects: c.reconfigure(c.make(assist)) })
  }, [assist])

  useEffect(() => {
    view.current?.dispatch({ effects: readOnlyC.current.reconfigure(EditorState.readOnly.of(readOnly)) })
  }, [readOnly])

  useEffect(() => {
    if (focusToken) view.current?.focus()
  }, [focusToken])

  return <div ref={host} className="h-full overflow-hidden" style={{ minHeight }} data-testid="code-editor" />
}
