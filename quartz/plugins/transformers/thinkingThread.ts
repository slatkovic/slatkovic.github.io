import { QuartzTransformerPlugin } from "../types"

export const ThinkingThread: QuartzTransformerPlugin = () => ({
  name: "ThinkingThread",
  markdownPlugins() {
    return [
      () => (_tree, file) => {
        const version = file.data.frontmatter?.version
        if (typeof version === "number") {
          file.data.isVersion = true
          file.data.versionNumber = version
        }
      },
    ]
  },
})

declare module "vfile" {
  interface DataMap {
    isVersion: boolean
    versionNumber: number
  }
}
