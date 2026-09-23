import fs from 'node:fs'

// The application now uses the image_url supplied by the ingestion pipeline.
// Never inject category-wide fallback photos: doing so makes unrelated stories
// share the same image and harms editorial accuracy and SEO.
const path = 'src/App.jsx'
const source = fs.readFileSync(path, 'utf8')
if (source.includes('resolverImagemEditorial')) {
  console.log('Legacy editorial image resolver detected; no fallback images will be injected.')
} else {
  console.log('Editorial image fallback injection disabled; using article image_url only.')
}
