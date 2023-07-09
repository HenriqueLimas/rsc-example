import React from 'react'
import {Post} from "../components/post.js";

export function BlogPostPage({ postSlug }) {
  return <Post slug={postSlug} />
}
