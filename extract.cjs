const fs = require('fs');
const readline = require('readline');
const rl = readline.createInterface({
  input: fs.createReadStream('C:/Users/abusa/.gemini/antigravity/brain/397612c2-3331-4e19-8158-f85d01c00b52/.system_generated/logs/transcript_full.jsonl')
});
rl.on('line', (line) => {
  if (line.includes('"step_index":16338,')) {
    fs.writeFileSync('step16338.json', line, 'utf8');
  }
});
