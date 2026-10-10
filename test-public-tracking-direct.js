
import { initializeTestEnvironment, assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { readFileSync } from "fs";

async function runTests() {
  const projectId = "crispy-c9702";
  const rules = readFileSync("database.rules.json", "utf8");
  const testEnv = await initializeTestEnvironment({ projectId, database: { rules, host: "127.0.0.1", port: 9000 } });
  
  const authA = testEnv.authenticatedContext("userA", { sub: "userA" }).database();
  const unauth = testEnv.unauthenticatedContext().database();

  let results = [];
  async function test(id, path, authDb, op, payload, expectPass, promise) {
    let passed = false;
    try {
      if (expectPass) { await assertSucceeds(promise); passed = true; }
      else { await assertFails(promise); passed = true; }
    } catch(err) { passed = false; }
    const actual = passed ? (expectPass ? "SUCCEED" : "FAIL") : (expectPass ? "FAIL" : "SUCCEED");
    const testResult = `${id} | ${path} | ${authDb === authA ? "auth" : "unauth"} | ${op} | ${payload} | ${expectPass ? "SUCCEED" : "FAIL"} | ${actual} | ${passed ? "PASS" : "FAIL"}`;
    console.log(testResult);
    results.push(testResult);
  }

  const token = "trkDirect";
  await authA.ref(`PublicTracking/${token}`).set({
    OrderNumber: "1", Status: "New", EstimatedDelivery: "30", LastUpdate: "now"
  });

  // 1. unauthenticated IsModifying update
  await test("1", `PublicTracking/${token}/IsModifying`, unauth, "UPDATE", "true", false, unauth.ref(`PublicTracking/${token}/IsModifying`).set(true));
  // 2. authenticated IsModifying update
  await test("2", `PublicTracking/${token}/IsModifying`, authA, "UPDATE", "true", true, authA.ref(`PublicTracking/${token}/IsModifying`).set(true));
  // 3. unauthenticated ModificationExpiresAt update
  await test("3", `PublicTracking/${token}/ModificationExpiresAt`, unauth, "UPDATE", "123", false, unauth.ref(`PublicTracking/${token}/ModificationExpiresAt`).set(123));
  // 4. authenticated ModificationExpiresAt update
  await test("4", `PublicTracking/${token}/ModificationExpiresAt`, authA, "UPDATE", "123", true, authA.ref(`PublicTracking/${token}/ModificationExpiresAt`).set(123));
  // 5. unauthenticated arbitrary sibling
  await test("5", `PublicTracking/${token}/hacked`, unauth, "UPDATE", "true", false, unauth.ref(`PublicTracking/${token}/hacked`).set(true));
  // 6. authenticated arbitrary sibling
  await test("6", `PublicTracking/${token}/hacked`, authA, "UPDATE", "true", false, authA.ref(`PublicTracking/${token}/hacked`).set(true));
  // 7. unauthenticated Status modification
  await test("7", `PublicTracking/${token}/Status`, unauth, "UPDATE", "Cooking", false, unauth.ref(`PublicTracking/${token}/Status`).set("Cooking"));
  // 8. authenticated Status modification
  await test("8", `PublicTracking/${token}/Status`, authA, "UPDATE", "Cooking", false, authA.ref(`PublicTracking/${token}/Status`).set("Cooking"));
  // 9. unauthenticated OrderNumber modification
  await test("9", `PublicTracking/${token}/OrderNumber`, unauth, "UPDATE", "2", false, unauth.ref(`PublicTracking/${token}/OrderNumber`).set("2"));
  // 10. authenticated OrderNumber modification
  await test("10", `PublicTracking/${token}/OrderNumber`, authA, "UPDATE", "2", false, authA.ref(`PublicTracking/${token}/OrderNumber`).set("2"));
  // 11. unauthenticated EstimatedDelivery modification
  await test("11", `PublicTracking/${token}/EstimatedDelivery`, unauth, "UPDATE", "10", false, unauth.ref(`PublicTracking/${token}/EstimatedDelivery`).set("10"));
  // 12. authenticated EstimatedDelivery modification
  await test("12", `PublicTracking/${token}/EstimatedDelivery`, authA, "UPDATE", "10", false, authA.ref(`PublicTracking/${token}/EstimatedDelivery`).set("10"));
  // 13. unauthenticated LastUpdate modification
  await test("13", `PublicTracking/${token}/LastUpdate`, unauth, "UPDATE", "10", false, unauth.ref(`PublicTracking/${token}/LastUpdate`).set("10"));
  // 14. authenticated LastUpdate modification
  await test("14", `PublicTracking/${token}/LastUpdate`, authA, "UPDATE", "10", false, authA.ref(`PublicTracking/${token}/LastUpdate`).set("10"));
  
  // 15. delete IsModifying
  await test("15", `PublicTracking/${token}/IsModifying`, authA, "DELETE", "null", false, authA.ref(`PublicTracking/${token}/IsModifying`).remove());
  // 16. delete ModificationExpiresAt
  await test("16", `PublicTracking/${token}/ModificationExpiresAt`, authA, "DELETE", "null", false, authA.ref(`PublicTracking/${token}/ModificationExpiresAt`).remove());
  // 17. delete whole tracking record
  await test("17", `PublicTracking/${token}`, authA, "DELETE", "null", false, authA.ref(`PublicTracking/${token}`).remove());
  
  // 18. multi-field update
  await test("18", `PublicTracking/${token}`, authA, "UPDATE", "{IsModifying:false, ModificationExpired:true}", true, authA.ref(`PublicTracking/${token}`).update({IsModifying:false, ModificationExpired:true}));
  
  // 19. cross-token update
  const authB = testEnv.authenticatedContext("userB", { sub: "userB" }).database();
  await test("19", `PublicTracking/${token}`, authB, "UPDATE", "cross-token", true, authB.ref(`PublicTracking/${token}`).update({IsModifying:true})); // This passes because there is no UID check in tracking!
  
  // 20. forged privileged field
  await test("20", `PublicTracking/${token}`, authA, "UPDATE", "{admin:true}", false, authA.ref(`PublicTracking/${token}`).update({admin:true}));

  await testEnv.cleanup();
}
runTests();

