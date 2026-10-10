
import fs from "fs";
const content = fs.readFileSync("database.rules.json", "utf8");
let data = JSON.parse(content);
delete data.rules.PublicCustomers["$phone"].TotalSpent[".write"];
fs.writeFileSync("database.rules.json", JSON.stringify(data, null, 2));

