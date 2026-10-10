
import fs from "fs";
let content = fs.readFileSync("src/components/ModificationBanner.jsx", "utf8");

content = content.split("remove(ref(db, \\ActiveHoldRequests/\\\\));").join("remove(ref(db, `ActiveHoldRequests/${orderId}`));");
content = content.split("update(ref(db, \\PublicTracking/\\\\), {").join("update(ref(db, `PublicTracking/${orderId}`), {");
content = content.split("navigate(\\/track/\\\\);").join("navigate(`/track/${orderId}`);");
content = content.split("const timeString = \\:\\;").join("const timeString = `${minutes}:${seconds.toString().padStart(2, \"0\")}`;");

fs.writeFileSync("src/components/ModificationBanner.jsx", content);

