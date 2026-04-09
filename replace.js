const fs = require('fs');
const path = './components/NewtonJeepMission.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/green/g, 'cyan');
content = content.replace(/#00ff00/g, '#00f2ff');
content = content.replace(/rgba\(0, 255, 0/g, 'rgba(0, 242, 255');
content = content.replace(/rgba\(0,255,0/g, 'rgba(0,242,255');

fs.writeFileSync(path, content);
console.log('Done');
