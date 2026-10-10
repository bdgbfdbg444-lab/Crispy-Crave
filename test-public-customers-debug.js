
import { initializeTestEnvironment, assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { readFileSync } from "fs";

async function runTests() {
  const projectId = "crispy-c9702";
  const rules = readFileSync("database.rules.json", "utf8");
  const testEnv = await initializeTestEnvironment({ projectId, database: { rules, host: "127.0.0.1", port: 9000 } });
  
  const authA = testEnv.authenticatedContext("userA", { sub: "userA" }).database();

  try {
    await authA.ref(`PublicCustomers/01000/uid`).set("userA");
    console.log("uid set success");
  } catch(e) { console.error("uid set fail", e.message); }

  try {
    await authA.ref(`PublicCustomers/01001/Phone`).set("01001");
    console.log("Phone set success");
  } catch(e) { console.error("Phone set fail", e.message); }

  try {
    await authA.ref(`PublicCustomers/01002/TotalOrders`).set(0);
    console.log("TotalOrders set success");
  } catch(e) { console.error("TotalOrders set fail", e.message); }

  await testEnv.cleanup();
}
runTests();

