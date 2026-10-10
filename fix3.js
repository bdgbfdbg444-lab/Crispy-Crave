
const fs = require("fs");
const content = fs.readFileSync("database.rules.json", "utf8");
let data = JSON.parse(content);
data.rules.PublicCustomers["$phone"].addresses = {
  ".write": "auth != null && (!data.exists() || data.parent().child(\"uid\").val() === auth.uid)",
  "$index": {
    ".validate": "newData.hasChildren([\"id\", \"fullAddress\", \"zone\"])",
    "id": { ".validate": "newData.isString()" },
    "label": { ".validate": "newData.isString() || !newData.exists()" },
    "fullAddress": { ".validate": "newData.isString()" },
    "zone": { ".validate": "newData.isString()" },
    "street": { ".validate": "newData.isString() || !newData.exists()" },
    "building": { ".validate": "newData.isString() || !newData.exists()" },
    "floor": { ".validate": "newData.isString() || !newData.exists()" },
    "apartment": { ".validate": "newData.isString() || !newData.exists()" },
    "landmark": { ".validate": "newData.isString() || !newData.exists()" },
    "lat": { ".validate": "newData.isNumber() || !newData.exists()" },
    "lng": { ".validate": "newData.isNumber() || !newData.exists()" },
    "isDefault": { ".validate": "newData.isBoolean() || !newData.exists()" },
    "isOutOfZone": { ".validate": "newData.isBoolean() || !newData.exists()" },
    "$other": { ".validate": false }
  }
};
fs.writeFileSync("database.rules.json", JSON.stringify(data, null, 2));

