// HTML-aware word diff utility
// Tokenizes HTML into tags and text words, diffs text words using Myers algorithm,
// then rebuilds annotated HTML with <ins>/<del> wrapping.

type Token = { kind: "tag"; raw: string } | { kind: "word"; text: string }

/** Split HTML into tag tokens and text-word tokens, preserving whitespace in tags. */
export function tokenize(html: string): Token[] {
  const tokens: Token[] = []
  const re = /(<[^>]*>)/g
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(html)) !== null) {
    if (m.index > last) {
      for (const w of splitWords(html.slice(last, m.index))) {
        tokens.push({ kind: "word", text: w })
      }
    }
    tokens.push({ kind: "tag", raw: m[1] })
    last = re.lastIndex
  }
  if (last < html.length) {
    for (const w of splitWords(html.slice(last))) {
      tokens.push({ kind: "word", text: w })
    }
  }
  return tokens
}

/** Split text into words, keeping whitespace attached to the preceding word. */
function splitWords(text: string): string[] {
  const words: string[] = []
  const re = /\S+\s*/g
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    words.push(m[0])
  }
  // Leading whitespace (e.g. between tags) — attach as its own token
  const leading = text.match(/^\s+/)
  if (leading && (words.length === 0 || !text.startsWith(words[0]))) {
    words.unshift(leading[0])
  }
  return words
}

export type DiffOp = { type: "equal" | "insert" | "delete"; words: string[] }

/** Myers diff on two word arrays. Returns a sequence of equal/insert/delete operations. */
export function diffWords(oldWords: string[], newWords: string[]): DiffOp[] {
  const N = oldWords.length
  const M = newWords.length
  const MAX = N + M

  if (MAX === 0) return []

  // Shortcut: identical
  if (N === M && oldWords.every((w, i) => w === newWords[i])) {
    return [{ type: "equal", words: newWords }]
  }

  // Myers shortest-edit-script
  const V: Record<number, number> = { 1: 0 }
  const trace: Record<number, number>[] = []

  outer: for (let d = 0; d <= MAX; d++) {
    trace.push({ ...V })
    for (let k = -d; k <= d; k += 2) {
      let x: number
      if (k === -d || (k !== d && V[k - 1]! < V[k + 1]!)) {
        x = V[k + 1]!
      } else {
        x = V[k - 1]! + 1
      }
      let y = x - k
      while (x < N && y < M && oldWords[x] === newWords[y]) {
        x++
        y++
      }
      V[k] = x
      if (x >= N && y >= M) break outer
    }
  }

  // Backtrack to build edit script
  type Edit = { prevK: number; prevX: number; prevY: number; x: number; y: number }
  const edits: Edit[] = []
  let x = N,
    y = M
  for (let d = trace.length - 1; d > 0; d--) {
    const v = trace[d - 1]
    const k = x - y
    let prevK: number
    if (k === -d || (k !== d && (v[k - 1] ?? -1) < (v[k + 1] ?? -1))) {
      prevK = k + 1
    } else {
      prevK = k - 1
    }
    const prevX = v[prevK]!
    const prevY = prevX - prevK
    edits.unshift({ prevK, prevX, prevY, x, y })
    x = prevX
    y = prevY
  }
  // Handle d=0 (initial snake)
  if (x > 0 || y > 0) {
    edits.unshift({ prevK: 0, prevX: 0, prevY: 0, x, y })
  }

  // Convert edits to diff operations
  const ops: DiffOp[] = []
  let ox = 0,
    oy = 0

  function pushOp(type: DiffOp["type"], words: string[]) {
    if (words.length === 0) return
    const last = ops[ops.length - 1]
    if (last && last.type === type) {
      last.words.push(...words)
    } else {
      ops.push({ type, words: [...words] })
    }
  }

  for (const edit of edits) {
    // Snake from (ox,oy) to (prevX,prevY)
    while (ox < edit.prevX && oy < edit.prevY) {
      pushOp("equal", [newWords[oy]])
      ox++
      oy++
    }
    // The edit step
    if (edit.x - edit.prevX > edit.y - edit.prevY) {
      // Deletion
      pushOp("delete", [oldWords[edit.prevX]])
      ox = edit.prevX + 1
      oy = edit.prevY
    } else if (edit.y - edit.prevY > edit.x - edit.prevX) {
      // Insertion
      pushOp("insert", [newWords[edit.prevY]])
      ox = edit.prevX
      oy = edit.prevY + 1
    } else {
      ox = edit.prevX
      oy = edit.prevY
    }
    // Post-edit snake
    while (ox < edit.x && oy < edit.y) {
      pushOp("equal", [newWords[oy]])
      ox++
      oy++
    }
  }

  return ops
}

/**
 * Build annotated HTML from the new version's tokens and the diff operations.
 * Tag tokens pass through unchanged. Insert words get <ins>, delete words get <del>.
 */
export function buildAnnotatedHTML(newTokens: Token[], diff: DiffOp[]): string {
  let result = ""
  let wordIdx = 0 // index into new version's word tokens
  let diffIdx = 0 // index into diff ops
  let diffWordIdx = 0 // index within current diff op's words

  // Collect all delete words that need to appear before the next equal/insert word
  let pendingDeletes: string[] = []

  // Flatten diff into per-word operations for easier consumption
  type FlatOp = { type: "equal" | "insert" | "delete"; word: string }
  const flat: FlatOp[] = []
  for (const op of diff) {
    for (const w of op.words) {
      flat.push({ type: op.type, word: w })
    }
  }
  let flatIdx = 0

  // Advance through flat diff, collecting deletes until we hit an equal/insert
  function consumeDeletes() {
    while (flatIdx < flat.length && flat[flatIdx].type === "delete") {
      pendingDeletes.push(flat[flatIdx].word)
      flatIdx++
    }
  }

  function flushDeletes() {
    if (pendingDeletes.length > 0) {
      result += `<del class="diff-remove">${pendingDeletes.join("")}</del>`
      pendingDeletes = []
    }
  }

  consumeDeletes()

  for (const token of newTokens) {
    if (token.kind === "tag") {
      result += token.raw
      continue
    }

    // This is a word token from the new version
    flushDeletes()

    if (flatIdx < flat.length) {
      const op = flat[flatIdx]
      if (op.type === "insert") {
        result += `<ins class="diff-add">${token.text}</ins>`
      } else {
        // equal
        result += token.text
      }
      flatIdx++
    } else {
      result += token.text
    }

    consumeDeletes()
  }

  // Flush any trailing deletes
  flushDeletes()

  return result
}

/** Main entry point: annotate newHTML with diffs against oldHTML. */
export function annotateHTML(oldHTML: string, newHTML: string): string {
  const oldTokens = tokenize(oldHTML)
  const newTokens = tokenize(newHTML)

  const oldWords = oldTokens.filter((t): t is Token & { kind: "word" } => t.kind === "word").map((t) => t.text)
  const newWords = newTokens.filter((t): t is Token & { kind: "word" } => t.kind === "word").map((t) => t.text)

  const diff = diffWords(oldWords, newWords)
  return buildAnnotatedHTML(newTokens, diff)
}
