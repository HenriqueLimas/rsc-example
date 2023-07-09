import React from 'react'
import ReactMarkdown from "react-markdown"
import {readFile} from "fs/promises"
import db from "../server/db.js"

export async function Post({ slug, hideComments }) {
  const [ content, comments ] = await Promise.all([
    readFile(`./posts/${slug}.md`, 'utf8'),
    db.findComments(slug)
  ])

  return (
    <section key={slug}>
      <ReactMarkdown components={{
        h1: (props) => (
          <h2>
            <a {...props} href={`/${slug}`} />
          </h2>
        )
      }}>
        {content}
      </ReactMarkdown>
      {!hideComments && (
        <>
          <ul>
            {comments.map(comment => (
              <li key={comment.id}>
                <p>{comment.content}</p>
              </li>
            ))}
          </ul>
          <form action={`/posts/comments`} method="post">
            <label htmlFor="comment">Add new comment</label>
            <textarea id="comment" name="comment"></textarea>
            <input type="hidden" value={slug} name="postId" />
            <input type="submit" value="Comment" />
          </form>
        </>
      )}
    </section>
  )
}
