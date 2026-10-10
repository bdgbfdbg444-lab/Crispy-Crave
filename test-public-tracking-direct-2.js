
import { initializeTestEnvironment, assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { readFileSync } from "fs";

async function runTests() {
  const projectId = "crispy-c9702";
  const rules = readFileSync("database.rules.json", "utf8");
  const testEnv = await initializeTestEnvironment({ projectId, database: { rules, host: "127.0.0.1", port: 9000 } });
  
  const authA = testEnv.authenticatedContext("userA", { sub: "userA" }).database();
  const authB = testEnv.authenticatedContext("userB", { sub: "userB" }).database();
  const unauth = testEnv.unauthenticatedContext().database();

  let results = [];
  async function test(id, path, authDb, op, expectPass, promise) {
    let passed = false;
    try {
      if (expectPass) { await assertSucceeds(promise); passed = true; }
      else { await assertFails(promise); passed = true; }
    } catch(err) { passed = false; }
    const actual = passed ? (expectPass ? "SUCCEED" : "FAIL") : (expectPass ? "FAIL" : "SUCCEED");
    const testResult = `${id} | ${path} | ${authDb === authA ? "authA" : authDb === authB ? "authB" : "unauth"} | ${op} | ${expectPass ? "SUCCEED" : "FAIL"} | ${actual} | ${passed ? "PASS" : "FAIL"}`;
    console.log(testResult);
    results.push(testResult);
  }

  // 1. PUBLIC TRACKING DIRECT CHILD CREATION
  await test("2A", `PublicTracking/T1/Status`, unauth, "CREATE", false, unauth.ref(`PublicTracking/T1/Status`).set("New"));
  await test("2B", `PublicTracking/T2/Status`, authA, "CREATE", false, authA.ref(`PublicTracking/T2/Status`).set("New"));
  await test("2C", `PublicTracking/T3/OrderNumber`, unauth, "CREATE", false, unauth.ref(`PublicTracking/T3/OrderNumber`).set("123"));
  await test("2D", `PublicTracking/T4/OrderNumber`, authA, "CREATE", false, authA.ref(`PublicTracking/T4/OrderNumber`).set("123"));
  await test("2E", `PublicTracking/T5/EstimatedDelivery`, unauth, "CREATE", false, unauth.ref(`PublicTracking/T5/EstimatedDelivery`).set("30"));
  await test("2F", `PublicTracking/T6/LastUpdate`, unauth, "CREATE", false, unauth.ref(`PublicTracking/T6/LastUpdate`).set("now"));

  // ACTIVE HOLD TESTS
  await authA.ref("ActiveHoldRequests/H1").set({ OrderId: "1", ExpiresAt: 1, uid: "userA" });
  await test("4.1", "ActiveHoldRequests/H1", authA, "CREATE", true, Promise.resolve());
  await test("4.2", "ActiveHoldRequests/H1", authA, "UPDATE", true, authA.ref("ActiveHoldRequests/H1").update({ ExpiresAt: 2 }));
  await test("4.4", "ActiveHoldRequests/H1", authB, "UPDATE", false, authB.ref("ActiveHoldRequests/H1").update({ ExpiresAt: 3 }));
  await test("4.5", "ActiveHoldRequests/H1", authB, "DELETE", false, authB.ref("ActiveHoldRequests/H1").remove());
  await test("4.6", "ActiveHoldRequests/H2", authA, "CREATE (uid=B)", false, authA.ref("ActiveHoldRequests/H2").set({ OrderId: "2", ExpiresAt: 1, uid: "userB" }));
  await test("4.7", "ActiveHoldRequests/H1", authA, "UPDATE (change uid)", false, authA.ref("ActiveHoldRequests/H1").update({ uid: "userB" }));
  await test("4.8", "ActiveHoldRequests/H1/uid", authA, "DELETE (remove uid)", false, authA.ref("ActiveHoldRequests/H1/uid").remove());
  await test("4.9", "ActiveHoldRequests/H3", unauth, "CREATE", false, unauth.ref("ActiveHoldRequests/H3").set({ OrderId: "3", ExpiresAt: 1, uid: "userA" }));
  await test("4.10", "ActiveHoldRequests/H1", unauth, "DELETE", false, unauth.ref("ActiveHoldRequests/H1").remove());
  await test("4.3", "ActiveHoldRequests/H1", authA, "DELETE", true, authA.ref("ActiveHoldRequests/H1").remove());

  // ANALYTICS TESTS
  const sId = "sess1";
  await test("6.1", `_analytics/online/${sId}`, unauth, "CREATE", true, unauth.ref(`_analytics/online/${sId}`).set({ page: "/", startTime: "now", timestamp: "now", deviceType: "mobile", ip: "1.2.3.4", location: "Egypt", history: [{page: "/", time: "now"}] }));
  await test("6.2", `_analytics/online/${sId}`, unauth, "UPDATE", true, unauth.ref(`_analytics/online/${sId}`).update({ page: "/menu" }));
  await test("6.3", `_analytics/online/${sId}`, unauth, "DELETE", true, unauth.ref(`_analytics/online/${sId}`).remove());
  await test("6.4", `_analytics/online/${sId}`, authA, "CREATE", true, authA.ref(`_analytics/online/${sId}`).set({ page: "/", startTime: "now", timestamp: "now", deviceType: "mobile", ip: "1.2.3.4", location: "Egypt", history: [{page: "/", time: "now"}] }));
  await test("6.5", `_analytics/online/${sId}`, authA, "UPDATE", true, authA.ref(`_analytics/online/${sId}`).update({ page: "/menu" }));
  await test("6.6", `_analytics/online/${sId}`, authA, "DELETE", true, authA.ref(`_analytics/online/${sId}`).remove());
  await test("6.7", `_analytics/online/${sId}`, unauth, "UPDATE (extra field)", false, unauth.ref(`_analytics/online/${sId}`).update({ hacked: true }));
  await test("6.8", `_analytics/online/${sId}/page`, unauth, "UPDATE (wrong type)", false, unauth.ref(`_analytics/online/${sId}/page`).set(123));
  await test("6.9", `_analytics/online/${sId}/history/0`, unauth, "UPDATE (malformed history)", false, unauth.ref(`_analytics/online/${sId}/history/0`).set({ hacked: true }));

  await testEnv.cleanup();
}
runTests();


