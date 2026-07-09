import { createContentLoader } from 'vitepress'

export default createContentLoader('posts/*.md', {
  excerpt: true,
  transform(raw) {
    return raw
      .filter(({ frontmatter }) => frontmatter && frontmatter.title)
      .sort((a, b) => {
        const dateA = new Date(a.frontmatter.date || 0).getTime()
        const dateB = new Date(b.frontmatter.date || 0).getTime()
        return dateB - dateA 
      })
  }
})