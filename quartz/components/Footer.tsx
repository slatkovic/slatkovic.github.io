import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import style from "./styles/footer.scss"

interface Options {
  links: Record<string, string>
}

export default ((opts?: Options) => {
  const Footer: QuartzComponent = ({ displayClass, cfg, fileData }: QuartzComponentProps) => {
    return (
      <nav class="site-nav">
        <a href="/">Home</a>
      </nav>
    )
  }

  Footer.css = style
  return Footer
}) satisfies QuartzComponentConstructor
