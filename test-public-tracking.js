
import { initializeTestEnvironment, assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { readFileSync } from "fs";

async function runTests() {
  const projectId = "crispy-c9702";
  const rules = readFileSync("database.rules.json", "utf8");
  const testEnv = await initializeTestEnvironment({ projectId, database: { rules, host: "127.0.0.1", port: 9000 } });
  const authA = testEnv.authenticatedContext("userA", { sub: "userA" }).database();
  const token = "trk" + Date.now();
  async function test(id, desc, promise, expectPass) {
    let passed = false;
    try {
      if (expectPass) { await assertSucceeds(promise); passed = true; }
      else { await assertFails(promise); passed = true; }
    } catch(err) {
      passed = false;
    }
    console.log(`${id} | PublicTracking/tok | ${desc} | ${expectPass ? "SUCCEED" : "FAIL"} | ${passed ? "PASS" : "FAIL"}`);
  }
  await test("A", "CREATE (Valid)", authA.ref(`PublicTracking/${token}`).set({
    OrderNumber: "123", Status: "New", EstimatedDelivery: "30 mins", LastUpdate: "now"
  }), true);
  await test("B", "UPDATE (IsModifying)", authA.ref(`PublicTracking/${token}`).update({ IsModifying: true }), true);
  await test("C", "UPDATE (Modify Status)", authA.ref(`PublicTracking/${token}`).update({ Status: "Cooking" }), false);
  await test("D", "UPDATE (Modify OrderNumber)", authA.ref(`PublicTracking/${token}`).update({ OrderNumber: "999" }), false);
  await test("E", "UPDATE (Modify EstimatedDelivery)", authA.ref(`PublicTracking/${token}`).update({ EstimatedDelivery: "10 mins" }), false);
  await test("F", "UPDATE (Modify LastUpdate)", authA.ref(`PublicTracking/${token}`).update({ LastUpdate: "later" }), false);
  await test("G", "UPDATE (Arbitrary Field)", authA.ref(`PublicTracking/${token}`).update({ Hacked: true }), false);
  await test("H", "DELETE", authA.ref(`PublicTracking/${token}`).remove(), false);
  await authA.ref(`PublicTracking/${token}`).update({ IsModifying: false });
  await test("I", "UPDATE (IsModifying false->true)", authA.ref(`PublicTracking/${token}`).update({ IsModifying: true }), true);
  await test("J", "UPDATE (IsModifying true->false)", authA.ref(`PublicTracking/${token}`).update({ IsModifying: false }), true);
  await test("K", "UPDATE (Multiple valid fields)", authA.ref(`PublicTracking/${token}`).update({ IsModifying: true, ModificationExpiresAt: 1234 }), true);
  const authB = testEnv.authenticatedContext("userB", { sub: "userB" }).database();
  await test("L", "UPDATE (Cross-token auth B)", authB.ref(`PublicTracking/${token}`).update({ IsModifying: true }), true); 
  await testEnv.cleanup();
}
runTests();

