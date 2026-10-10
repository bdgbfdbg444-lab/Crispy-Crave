
import { initializeTestEnvironment, assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { readFileSync } from "fs";
async function runTests() {
  const projectId = "crispy-c9702";
  const rules = readFileSync("database.rules.json", "utf8");
  const testEnv = await initializeTestEnvironment({ projectId, database: { rules, host: "127.0.0.1", port: 9000 } });
  await testEnv.clearDatabase();
  const authA = testEnv.authenticatedContext("userA").database();
  
  try {
    await assertSucceeds(
      authA.ref(`PublicCustomers/01003`).update({ uid: "userA", Phone: "01003", TotalOrders: 0 })
    );
    console.log("Creation without TotalSpent SUCCEEDED!");
  } catch(e) { console.error("FAILED:", e.message); }
  await testEnv.cleanup();
}
runTests();

