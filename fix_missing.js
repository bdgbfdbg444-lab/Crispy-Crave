
import fs from "fs";
const content = fs.readFileSync("database.rules.json", "utf8");
let data = JSON.parse(content);
const cust = data.rules.PublicCustomers["$phone"];

cust.uid[".write"] = "auth != null && (!data.exists() ? newData.val() === auth.uid : data.val() === auth.uid && newData.val() === auth.uid)";
cust.Phone[".write"] = "auth != null && newData.parent().child(\"uid\").val() === auth.uid && newData.val() === $phone";
cust.Name[".write"] = "auth != null && newData.parent().child(\"uid\").val() === auth.uid";
cust.Address[".write"] = "auth != null && newData.parent().child(\"uid\").val() === auth.uid";
cust.Email[".write"] = "auth != null && newData.parent().child(\"uid\").val() === auth.uid";
cust.addresses[".write"] = "auth != null && newData.parent().child(\"uid\").val() === auth.uid";
cust.Zone[".write"] = "auth != null && newData.parent().child(\"uid\").val() === auth.uid";
cust.zone[".write"] = "auth != null && newData.parent().child(\"uid\").val() === auth.uid";
cust.TotalOrders[".write"] = "auth != null && newData.parent().child(\"uid\").val() === auth.uid && !data.exists() && newData.val() === 0";

fs.writeFileSync("database.rules.json", JSON.stringify(data, null, 2));

