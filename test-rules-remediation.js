
import { initializeTestEnvironment, assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { readFileSync } from "fs";

async function runTests() {
  const projectId = "crispy-c9702";
  const rules = readFileSync("database.rules.json", "utf8");
  const testEnv = await initializeTestEnvironment({ projectId, database: { rules, host: "127.0.0.1", port: 9000 } });
  const authA = testEnv.authenticatedContext("userA", { sub: "userA" }).database();
  
  try {
    await assertSucceeds(authA.ref("PublicCustomers/0102").set({uid: "userA", Phone: "0102"}));
    console.log("PASS: User A creates own profile");
  } catch (err) {
    console.log("FAIL: User A creates own profile - " + err.message);
  }
  await testEnv.cleanup();
}
runTests();

