import fs from 'node:fs'

const path = 'src/App.jsx'
let s = fs.readFileSync(path, 'utf8')
s = s.replaceAll('Informação que move decisões.', 'Informações que movem decisões.')
fs.writeFileSync(path, s)
console.log('Brand wording patch applied')
