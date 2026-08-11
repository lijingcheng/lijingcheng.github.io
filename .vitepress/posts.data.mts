import { createContentLoader } from 'vitepress'

export default createContentLoader('posts/*.md', {
  excerpt: true,
  transform(raw) {
    const toTime = (d) => {
      if (!d) return 0
      let s = String(d).trim()
        .replace(/^(\d{4}-\d{2}-\d{2}) /, '$1T')
        .replace(/([+-]\d{2})(\d{2})(\s|$)/, '$1:$2')
        .replace(/\s/g, '')
      const t = new Date(s).getTime()
      return isNaN(t) ? 0 : t
    }
    return raw
      .filter(({ frontmatter }) => frontmatter && frontmatter.title)
      .sort((a, b) => toTime(b.frontmatter.date) - toTime(a.frontmatter.date))
  }
})