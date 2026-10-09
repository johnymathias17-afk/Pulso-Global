import fs from 'node:fs'

const path = 'src/App.jsx'
const source = fs.readFileSync(path, 'utf8')
const expandedQuery = ".order('published_at', { ascending: false, nullsFirst: false }).limit(150)"
const boundedQuery = ".order('published_at', { ascending: false, nullsFirst: false }).limit(50)"

const fixed = source.replaceAll(expandedQuery, boundedQuery)
if (fixed !== source) {
  fs.writeFileSync(path, fixed)
  console.log('News query limit normalized to 50 to avoid unnecessary database load.')
} else {
  console.log('News query limit already normalized; no change needed.')
}
