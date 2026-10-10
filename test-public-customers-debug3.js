
import { initializeTestEnvironment } from "@firebase/rules-unit-testing";
import { readFileSync } from "fs";

async function runTests() {
  const projectId = "crispy-c9702";
  const rules = readFileSync("database.rules.json", "utf8");
  const testEnv = await initializeTestEnvironment({ projectId, database: { rules, host: "127.0.0.1", port: 9000 } });
  const authA = testEnv.authenticatedContext("userA").database();

  try {
    await authA.ref(`PublicCustomers/01000`).update({ uid: "userA" });
    console.log("uid alone SUCCESS");
  } catch(e) { console.error("uid alone FAIL:", e.message); }

  try {
    await authA.ref(`PublicCustomers/01001`).update({ Phone: "01001" });
    console.log("Phone alone SUCCESS");
  } catch(e) { console.error("Phone alone FAIL:", e.message); }

  try {
    await authA.ref(`PublicCustomers/01002`).update({ TotalOrders: 0 });
    console.log("TotalOrders alone SUCCESS");
  } catch(e) { console.error("TotalOrders alone FAIL:", e.message); }

  await testEnv.cleanup();
}
runTests();


