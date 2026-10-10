
import { initializeTestEnvironment, assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { readFileSync } from "fs";

async function runTests() {
  const projectId = "crispy-c9702";
  const rules = readFileSync("database.rules.json", "utf8");
  const testEnv = await initializeTestEnvironment({ projectId, database: { rules, host: "127.0.0.1", port: 9000 } });
  
  await testEnv.clearDatabase();
  const db = testEnv.unauthenticatedContext().database();

  try {
      await assertSucceeds(db.ref("_analytics/online/v_123").set({
          page: "/",
          startTime: "123",
          timestamp: 123456, // IS_NUMBER!
          deviceType: "mobile",
          ip: "1.1.1.1",
          location: "Unknown"
          // no history, simulate empty array drop
      }));
      console.log("Set number timestamp SUCCESS");
  } catch(e) {
      console.log("Set number timestamp FAIL:", e.message);
  }

  // Multi-path update test
  try {
      await assertSucceeds(db.ref().update({
          "_analytics/daily/2026-09-18/totalPageViews": 1,
          "_analytics/daily/2026-09-18/hourly/10/pageViews": 1,
          "_analytics/online/v_123/history/0": { page: "/", time: "123" }
      }));
      console.log("Update SUCCESS");
  } catch(e) {
      console.log("Update FAIL:", e.message);
  }

  await testEnv.cleanup();
}
runTests();

