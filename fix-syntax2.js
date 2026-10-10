
import fs from "fs";
let content = fs.readFileSync("src/components/ModificationBanner.jsx", "utf8");

content = content.split("const timeString = \\\\:\\\\;").join("const timeString = `${minutes}:${seconds.toString().padStart(2, \"0\")}`;");

fs.writeFileSync("src/components/ModificationBanner.jsx", content);

