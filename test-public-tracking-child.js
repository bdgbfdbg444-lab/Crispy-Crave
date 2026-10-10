
import { initializeTestEnvironment, assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { readFileSync } from "fs";

async function runTests() {
  const projectId = "crispy-c9702";
  const rules = readFileSync("database.rules.json", "utf8");
  const testEnv = await initializeTestEnvironment({ projectId, database: { rules, host: "127.0.0.1", port: 9000 } });
  
  const authA = testEnv.authenticatedContext("userA", { sub: "userA" }).database();

  let results = [];
  async function test(id, op, promise, expectPass) {
    let passed = false;
    try {
      if (expectPass) { await assertSucceeds(promise); passed = true; }
      else { await assertFails(promise); passed = true; }
    } catch(err) { passed = false; }
    const res = `${id} | ${op} | ${expectPass ? "SUCCEED" : "FAIL"} | ${passed ? "PASS" : "FAIL"}`;
    console.log(res);
  }

  const token = "trkChild";
  await test("1", "CREATE valid", authA.ref(`PublicTracking/${token}`).set({
    OrderNumber: "1", Status: "New", EstimatedDelivery: "30", LastUpdate: "now"
  }), true);

  await test("2", "UPDATE allowed fields", authA.ref(`PublicTracking/${token}`).update({ IsModifying: true, ModificationExpiresAt: 123 }), true);
  await test("3", "UPDATE protected Status", authA.ref(`PublicTracking/${token}/Status`).set("Cooking"), false);
  await test("4", "UPDATE protected OrderNumber", authA.ref(`PublicTracking/${token}/OrderNumber`).set("2"), false);
  
  await test("5", "DELETE protected field", authA.ref(`PublicTracking/${token}/Status`).remove(), false);
  await test("6", "DELETE token entirely", authA.ref(`PublicTracking/${token}`).remove(), false);

  await testEnv.cleanup();
}
runTests();

