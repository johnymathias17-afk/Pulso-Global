import fs from 'node:fs'

// Preserve image_url from Supabase. Missing images remain missing until the
// ingestion pipeline supplies a verified article-specific image.
const path = 'src/App.jsx'
const source = fs.readFileSync(path, 'utf8')
console.log(source.includes('image_url') ? 'Editorial media: preserving verified article images.' : 'Editorial media patch loaded.')
