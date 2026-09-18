const fs = require('fs');
const data = JSON.parse(fs.readFileSync('step16338.json', 'utf8'));
if (data.content && data.content.includes('diff --git')) {
   const diffStart = data.content.indexOf('diff --git');
   let diffContent = data.content.substring(diffStart);
   // Remove the system wrapper output if any
   if (diffContent.includes('\n</SYSTEM_MESSAGE>')) {
       diffContent = diffContent.split('\n</SYSTEM_MESSAGE>')[0];
   }
   fs.writeFileSync('exact_patch.diff', diffContent, 'utf8');
   console.log('Successfully wrote exact_patch.diff, length: ' + diffContent.length);
}
