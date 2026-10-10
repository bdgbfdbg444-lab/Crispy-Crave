
import fs from "fs";
const content = fs.readFileSync("database.rules.json", "utf8");
let data = JSON.parse(content);
data.rules._analytics.online["$sessionId"].timestamp[".validate"] = "newData.isString()";
fs.writeFileSync("database.rules.json", JSON.stringify(data, null, 2));

