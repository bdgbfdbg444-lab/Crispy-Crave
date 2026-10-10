
import fs from "fs";
const content = fs.readFileSync("database.rules.json", "utf8");
let data = JSON.parse(content);

// 1. Add CustomerLoginEmails
data.rules.CustomerLoginEmails = {
  "$phone": {
    ".read": true,
    ".write": false
  }
};

// 2. Fix _analytics validation
const online = data.rules._analytics.online["$sessionId"];
online[".validate"] = "!newData.exists() || newData.hasChildren([\"page\", \"startTime\", \"timestamp\", \"deviceType\", \"ip\", \"location\"])"; // removed history from required
online.timestamp[".validate"] = "newData.isNumber()";

fs.writeFileSync("database.rules.json", JSON.stringify(data, null, 2));

