
import fs from "fs";
let content = fs.readFileSync("src/services/visitorTracker.js", "utf8");
content = content.replace(
  "set(presenceRef, presenceData())",
  "console.log(\"SENDING PRESENCE:\", JSON.stringify(presenceData())); set(presenceRef, presenceData())"
);
fs.writeFileSync("src/services/visitorTracker.js", content);

