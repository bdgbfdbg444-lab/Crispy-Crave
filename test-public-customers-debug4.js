
import { initializeTestEnvironment } from "@firebase/rules-unit-testing";
import { readFileSync } from "fs";
async function runTests() {
  const projectId = "crispy-c9702";
  const rules = readFileSync("database.rules.json", "utf8");
  const testEnv = await initializeTestEnvironment({ projectId, database: { rules, host: "127.0.0.1", port: 9000 } });
  const authA = testEnv.authenticatedContext("userA").database();
  try {
    await authA.ref(`PublicCustomers/01000`).update({ uid: "userA", Phone: "01000" });
    console.log("uid+phone SUCCESS");
  } catch(e) { console.error("uid+phone FAIL:", e.message); }
  
  try {
    await authA.ref(`PublicCustomers/01001`).update({ uid: "userA", Phone: "01001", TotalOrders: 0 });
    console.log("uid+phone+total SUCCESS");
  } catch(e) { console.error("uid+phone+total FAIL:", e.message); }
  await testEnv.cleanup();
}
runTests();

