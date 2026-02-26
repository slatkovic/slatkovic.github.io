import { annotateHTML } from "./diff"

let ttNavigating = false

document.addEventListener("nav", () => {
  const container = document.querySelector<HTMLElement>(".thinking-thread-track-container")
  if (!container) return

  const track = container.querySelector<HTMLElement>(".thinking-thread-track")
  const marker = container.querySelector<HTMLElement>(".thinking-thread-track-marker")
  const fill = container.querySelector<HTMLElement>(".thinking-thread-track-fill")
  const countLabel = container.closest(".thinking-thread")?.querySelector(".thinking-thread-count")
  const navEl = container.closest(".thinking-thread")?.querySelector(".thinking-thread-nav")
  if (!track || !marker || !fill) return

  const urls: string[] = JSON.parse(container.dataset.versions ?? "[]")
  const titles: string[] = JSON.parse(container.dataset.titles ?? "[]")
  const total = parseInt(container.dataset.total ?? "0", 10)
  if (total < 2) return

  const currentIndex = parseInt(container.dataset.current ?? "0", 10)
  const article = document.querySelector<HTMLElement>("article")

  // Article crossfade when arriving via thinking thread navigation
  if (ttNavigating && article) {
    article.style.opacity = "0"
    article.style.transition = "opacity 0.2s ease"
    article.getBoundingClientRect() // force reflow
    article.style.opacity = "1"
    article.addEventListener(
      "transitionend",
      () => {
        article.style.removeProperty("opacity")
        article.style.removeProperty("transition")
      },
      { once: true },
    )
    ttNavigating = false
  }

  // -- Page cache & live preview during drag --
  const pageCache = new Map<string, Promise<string>>()
  let displayedIndex = currentIndex
  let previewGen = 0

  function fetchPage(url: string): Promise<string> {
    let cached = pageCache.get(url)
    if (!cached) {
      cached = fetch(url)
        .then((res) => res.text())
        .catch((err) => {
          pageCache.delete(url)
          throw err
        })
      pageCache.set(url, cached)
    }
    return cached
  }

  function extractArticleHTML(pageHTML: string): string | null {
    const doc = new DOMParser().parseFromString(pageHTML, "text/html")
    return doc.querySelector("article")?.innerHTML ?? null
  }

  function animateDiffIn() {
    if (!article) return
    const diffEls = article.querySelectorAll<HTMLElement>("ins.diff-add, del.diff-remove")
    diffEls.forEach((el) => el.classList.add("diff-entering"))
    article.getBoundingClientRect() // force reflow
    diffEls.forEach((el) => el.classList.remove("diff-entering"))
  }

  // Prefetch adjacent versions for smooth dragging
  if (urls[currentIndex - 1]) fetchPage(urls[currentIndex - 1])
  if (urls[currentIndex + 1]) fetchPage(urls[currentIndex + 1])

  // Show a specific version's content with diff annotations (used during drag)
  async function showVersion(index: number) {
    if (index === displayedIndex || !article) return
    displayedIndex = index
    const gen = ++previewGen

    try {
      const html = await fetchPage(urls[index])
      if (gen !== previewGen) return

      const content = extractArticleHTML(html)
      if (!content || gen !== previewGen) return

      if (index > 0 && urls[index - 1]) {
        const prevHTML = await fetchPage(urls[index - 1])
        if (gen !== previewGen) return
        const prevContent = extractArticleHTML(prevHTML)
        article.innerHTML = prevContent ? annotateHTML(prevContent, content) : content
      } else {
        article.innerHTML = content
      }

      if (gen !== previewGen) return
      animateDiffIn()

      // Prefetch neighbors of new position
      if (urls[index - 1]) fetchPage(urls[index - 1])
      if (urls[index + 1]) fetchPage(urls[index + 1])
    } catch {}
  }

  // Initial diff annotation on page load (skipped if drag starts first)
  if (currentIndex > 0) {
    const prevUrl = urls[currentIndex - 1]
    if (prevUrl && article) {
      fetchPage(prevUrl)
        .then((html) => {
          if (previewGen > 0) return // drag started, skip
          const prevContent = extractArticleHTML(html)
          if (prevContent) {
            article.innerHTML = annotateHTML(prevContent, article.innerHTML)
            animateDiffIn()
          }
        })
        .catch(() => {})
    }
  }

  function getRatio(clientX: number): number {
    const rect = track!.getBoundingClientRect()
    return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
  }

  function getNearestIndex(clientX: number): number {
    return Math.round(getRatio(clientX) * (total - 1))
  }

  // Move marker/fill to an exact percentage (smooth, no snapping)
  function moveToRatio(ratio: number) {
    const pct = ratio * 100
    marker!.style.left = `${pct}%`
    fill!.style.width = `${pct}%`

    // Update count label to nearest index
    const nearestIndex = Math.round(ratio * (total - 1))
    if (countLabel) {
      countLabel.textContent = `\u00B7 ${nearestIndex + 1} of ${total}`
    }
  }

  // Snap marker/fill to a discrete version index and update nav links
  function snapToIndex(index: number) {
    const progress = (index / (total - 1)) * 100
    marker!.style.left = `${progress}%`
    fill!.style.width = `${progress}%`

    if (countLabel) {
      countLabel.textContent = `\u00B7 ${index + 1} of ${total}`
    }

    // Update prev/next link text
    if (navEl) {
      const prevLink = navEl.querySelector("a:first-child, span:first-child")
      const nextLink = navEl.querySelector("a:last-child, span:last-child")

      if (prevLink && index > 0) {
        const a = document.createElement("a")
        a.href = urls[index - 1]
        a.className = "internal"
        a.innerHTML = `&larr; ${titles[index - 1]}`
        prevLink.replaceWith(a)
      } else if (prevLink && index === 0) {
        prevLink.replaceWith(document.createElement("span"))
      }

      if (nextLink && nextLink !== prevLink && index < total - 1) {
        const a = document.createElement("a")
        a.href = urls[index + 1]
        a.className = "internal"
        a.innerHTML = `${titles[index + 1]} &rarr;`
        nextLink.replaceWith(a)
      } else if (nextLink && nextLink !== prevLink && index === total - 1) {
        nextLink.replaceWith(document.createElement("span"))
      }
    }
  }

  function navigate(index: number) {
    if (index === currentIndex) return
    if (urls[index]) {
      ttNavigating = true
      window.spaNavigate(new URL(urls[index], window.location.toString()))
    }
  }

  // -- Drag handling --
  let isDragging = false
  let grabOffset = 0 // offset between cursor and marker center at grab time
  const threadEl = container.closest(".thinking-thread") as HTMLElement | null

  function getClientX(e: MouseEvent | TouchEvent): number {
    if ("touches" in e) return e.touches[0]?.clientX ?? 0
    return e.clientX
  }

  function onPointerDown(e: MouseEvent | TouchEvent) {
    e.preventDefault()
    isDragging = true

    // Record offset so the marker doesn't jump to the cursor
    const markerRect = marker!.getBoundingClientRect()
    const markerCenter = markerRect.left + markerRect.width / 2
    grabOffset = getClientX(e) - markerCenter

    marker!.classList.add("dragging")
    threadEl?.classList.add("dragging")
    document.addEventListener("mousemove", onPointerMove)
    document.addEventListener("touchmove", onPointerMove, { passive: false })
    document.addEventListener("mouseup", onPointerUp)
    document.addEventListener("touchend", onPointerUp)
  }

  function onPointerMove(e: MouseEvent | TouchEvent) {
    if (!isDragging) return
    e.preventDefault()
    const ratio = getRatio(getClientX(e) - grabOffset)
    moveToRatio(ratio)

    // Live preview: update article content when crossing a version boundary
    const nearestIndex = Math.round(ratio * (total - 1))
    if (nearestIndex !== displayedIndex) {
      showVersion(nearestIndex)
    }
  }

  function onPointerUp(e: MouseEvent | TouchEvent) {
    if (!isDragging) return
    isDragging = false
    marker!.classList.remove("dragging")
    threadEl?.classList.remove("dragging")

    const clientX = "changedTouches" in e ? e.changedTouches[0]?.clientX ?? 0 : (e as MouseEvent).clientX
    const index = getNearestIndex(clientX - grabOffset)
    snapToIndex(index)
    navigate(index)

    document.removeEventListener("mousemove", onPointerMove)
    document.removeEventListener("touchmove", onPointerMove)
    document.removeEventListener("mouseup", onPointerUp)
    document.removeEventListener("touchend", onPointerUp)
  }

  marker.addEventListener("mousedown", onPointerDown)
  marker.addEventListener("touchstart", onPointerDown, { passive: false })

  // -- Track click (on container for larger hit area) --
  function onTrackClick(e: MouseEvent) {
    // Ignore clicks on the marker (drag handles that) and nav links
    const target = e.target as HTMLElement
    if (target.closest(".thinking-thread-track-marker") || target.closest(".thinking-thread-nav")) return
    const index = getNearestIndex(e.clientX)
    snapToIndex(index)
    navigate(index)
  }

  container.addEventListener("click", onTrackClick)

  // -- Prev/next link: set flag before SPA router intercepts --
  const onNavClick = () => {
    ttNavigating = true
  }
  navEl?.addEventListener("click", onNavClick)

  // -- Cleanup --
  window.addCleanup(() => {
    navEl?.removeEventListener("click", onNavClick)
    marker!.removeEventListener("mousedown", onPointerDown)
    marker!.removeEventListener("touchstart", onPointerDown)
    container!.removeEventListener("click", onTrackClick)
    document.removeEventListener("mousemove", onPointerMove)
    document.removeEventListener("touchmove", onPointerMove)
    document.removeEventListener("mouseup", onPointerUp)
    document.removeEventListener("touchend", onPointerUp)
  })
})
