const APP_CONFIG = {
  firebaseDbUrl: "https://crispy-c9702-default-rtdb.europe-west1.firebasedatabase.app/",
};

async function testFetch() {
  try {
    console.log("Testing version.json...");
    const vRes = await fetch(`${APP_CONFIG.firebaseDbUrl}version.json`);
    console.log("version.json status:", vRes.status);
    console.log("version.json data:", await vRes.text());

    console.log("\nTesting menu.json...");
    const mRes = await fetch(`${APP_CONFIG.firebaseDbUrl}menu.json`);
    console.log("menu.json status:", mRes.status);
    const mData = await mRes.json();
    console.log("menu.json categories count:", mData.categories ? Object.keys(mData.categories).length : 0);
    console.log("menu.json first category:", mData.categories ? Object.values(mData.categories)[0] : null);

    console.log("\nTesting WebsiteData.json...");
    const wRes = await fetch(`${APP_CONFIG.firebaseDbUrl}WebsiteData.json`);
    console.log("WebsiteData.json status:", wRes.status);
    console.log("WebsiteData.json data:", await wRes.json());
  } catch (error) {
    console.error("Fetch failed:", error);
  }
}

testFetch();
