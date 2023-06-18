import {readdir} from 'fs/promises'
import {Post} from '../components/post.js'

export async function BlogIndexPage() {
  const postFiles = await readdir('./posts')
  const postSlugs = postFiles.map(file =>
    file.slice(0, file.lastIndexOf('.'))
  )
  return (
    <section>
      <h1>Welcome to my blog</h1>
      <div>
      {postSlugs.map((slug) => (
        <Post key={slug} slug={slug} hideComments />
      ))}
      </div>
      <>
        <div>Fragment test</div>
        <p>YAYA</p>
      </>
    </section>
  )
}
