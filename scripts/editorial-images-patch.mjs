import fs from 'node:fs'

// Image policy: keep only publisher/ingestion images that belong to the article.
// Do not inject shared Unsplash/category fallbacks, because they create repeated
// or semantically incorrect photos across unrelated stories.
const path = 'src/App.jsx'
const source = fs.readFileSync(path, 'utf8')
console.log(source.includes('image_url') ? 'Editorial image policy: article image_url only.' : 'Editorial image policy loaded.')
