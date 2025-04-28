import type { APIContext } from 'astro'
import rss from '@astrojs/rss'
import MarkdownIt from 'markdown-it'
import sanitizeHtml from 'sanitize-html'
import { site } from '@/config.json'
import { getSortedPosts } from '@/utils/content'

const parser = new MarkdownIt()
const allowedTags = sanitizeHtml.defaults.allowedTags.concat(['img'])

export async function GET(context: APIContext) {
  const sortedPosts = await getSortedPosts()

  return rss({
    title: site.title,
    description: site.description,
    site: context.site!,
    items: sortedPosts.map((post) => ({
      link: `/posts/${post.slug}`,
      title: post.data.title,
      pubDate: post.data.date,
      description: post.data.summary,
      content: getPostContent(post),
    })),
    customData: `<language>${site.lang}</language>`,
  })
}

function getPostContent(post: any) {
  return sanitizeHtml(parser.render(post.body || ''), { allowedTags })
}
