
import fs from "fs";
const content = fs.readFileSync("database.rules.json", "utf8");
let data = JSON.parse(content);

const cust = data.rules.PublicCustomers["$phone"];
cust[".read"] = "auth != null && (!data.exists() || data.child(\"uid\").val() === auth.uid)";

fs.writeFileSync("database.rules.json", JSON.stringify(data, null, 2));

