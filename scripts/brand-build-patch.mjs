import fs from 'node:fs'

const path = 'src/App.jsx'
let s = fs.readFileSync(path, 'utf8')
s = s.replaceAll('Informação que move decisões.', 'Informações que movem decisões.')
// Improve mobile readability without changing the premium visual hierarchy.
s = s.replaceAll("color: '#667085', fontSize: '11px'", "color: '#475467', fontSize: '11px', fontWeight: '500'")
s = s.replaceAll("color: '#475467', fontSize: '17px'", "color: '#344054', fontSize: '17px', fontWeight: '500'")
s = s.replaceAll("color: '#475467', fontSize: '16px'", "color: '#344054', fontSize: '16px', fontWeight: '500'")
s = s.replaceAll("color: '#667085'", "color: '#475467'")
s = s.replaceAll("color: '#98A2B3'", "color: '#667085'")
fs.writeFileSync(path, s)
console.log('Brand wording and readability patch applied')
