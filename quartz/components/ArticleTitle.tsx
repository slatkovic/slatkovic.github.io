import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"

const ArticleTitle: QuartzComponent = ({ fileData, displayClass }: QuartzComponentProps) => {
  const title = fileData.frontmatter?.title
  if (title) {
    return (
      <div class={classNames(displayClass, "article-title-wrapper")}>
        <a href="/" class="back-link">← Home</a>
        <h1 class="article-title">{title}</h1>
      </div>
    )
  } else {
    return null
  }
}

ArticleTitle.css = `
.article-title-wrapper {
  margin: 2rem 0 0 0;
}
.article-title-wrapper .back-link {
  font-size: 0.85rem;
  color: var(--gray);
  text-decoration: none;
}
.article-title-wrapper .back-link:hover {
  color: var(--dark);
}
.article-title {
  margin: 0.3rem 0 0 0;
}
`

export default (() => ArticleTitle) satisfies QuartzComponentConstructor
