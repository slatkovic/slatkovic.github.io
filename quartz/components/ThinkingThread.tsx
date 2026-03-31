import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { resolveRelative } from "../util/path"
import style from "./styles/thinkingThread.scss"
import script from "./scripts/thinkingThread.inline"

interface VersionEntry {
  title: string
  slug: string
  versionNumber: number | null // null = current version
}

export default (() => {
  const ThinkingThread: QuartzComponent = ({
    fileData,
    allFiles,
  }: QuartzComponentProps) => {
    const slug = fileData.slug!
    const parts = slug.split("/")
    const dirPrefix = parts.slice(0, -1).join("/") + "/"

    const versions: VersionEntry[] = []
    let currentEntry: VersionEntry | null = null

    for (const f of allFiles) {
      if (!f.slug?.startsWith(dirPrefix)) continue

      const remainder = f.slug.slice(dirPrefix.length)
      if (remainder.includes("/")) continue

      if (typeof f.frontmatter?.version === "number") {
        versions.push({
          title: f.frontmatter.title ?? `v${f.frontmatter.version}`,
          slug: f.slug,
          versionNumber: f.frontmatter.version,
        })
      } else if (remainder === "index") {
        currentEntry = {
          title: f.frontmatter?.title ?? "Current",
          slug: f.slug,
          versionNumber: null,
        }
      }
    }

    versions.sort((a, b) => (a.versionNumber ?? Infinity) - (b.versionNumber ?? Infinity))
    if (currentEntry) {
      versions.push(currentEntry)
    }

    if (versions.length < 2) return null

    const currentIndex = versions.findIndex((v) => v.slug === slug)
    const progress = (currentIndex / (versions.length - 1)) * 100
    const prevVersion = currentIndex > 0 ? versions[currentIndex - 1] : null
    const nextVersion = currentIndex < versions.length - 1 ? versions[currentIndex + 1] : null

    return (
      <nav class="thinking-thread">
        <div class="thinking-thread-label">
          Thinking thread{" "}
          <span class="thinking-thread-count">
            &middot; {currentIndex + 1} of {versions.length}
          </span>
        </div>
        <div
          class="thinking-thread-track-container"
          data-versions={JSON.stringify(versions.map((v) => resolveRelative(slug, v.slug)))}
          data-titles={JSON.stringify(versions.map((v) => v.title))}
          data-current={currentIndex}
          data-total={versions.length}
        >
          <div class="thinking-thread-track">
            <div class="thinking-thread-track-fill" style={`width: ${progress}%`} />
            {versions.map((_, i) => (
              <div
                class="thinking-thread-track-tick"
                style={`left: ${(i / (versions.length - 1)) * 100}%`}
              />
            ))}
            <div class="thinking-thread-track-marker" style={`left: ${progress}%`} />
          </div>
        </div>
        <div class="thinking-thread-nav">
          {prevVersion ? (
            <a href={resolveRelative(slug, prevVersion.slug)} class="internal">
              &larr; {prevVersion.title}
            </a>
          ) : (
            <span />
          )}
          {nextVersion ? (
            <a href={resolveRelative(slug, nextVersion.slug)} class="internal">
              {nextVersion.title} &rarr;
            </a>
          ) : (
            <span />
          )}
        </div>
      </nav>
    )
  }

  ThinkingThread.css = style
  ThinkingThread.afterDOMLoaded = script
  return ThinkingThread
}) satisfies QuartzComponentConstructor
