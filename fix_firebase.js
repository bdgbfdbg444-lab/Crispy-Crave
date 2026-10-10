
import fs from "fs";
let content = fs.readFileSync("src/firebase.js", "utf8");
content = content.replace("import { getDatabase, connectDatabaseEmulator } from \"firebase/database\";", "import { getDatabase } from \"firebase/database\";");
content = content.replace("    connectDatabaseEmulator(db, \"127.0.0.1\", 9000);\n", "");
fs.writeFileSync("src/firebase.js", content);

