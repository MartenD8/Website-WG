import { chromium } from "playwright";

const BASE = "http://localhost:3011";

async function launch() {
  for (const channel of ["chrome", "msedge"]) {
    try {
      const browser = await chromium.launch({ channel });
      console.log("browser:", channel);
      return browser;
    } catch {
      // try next channel
    }
  }
  console.log("browser: playwright-chromium (kann kein H.264)");
  return chromium.launch();
}

const browser = await launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

page.on("response", (response) => {
  if (response.url().includes("/uploads/videos/")) {
    const headers = response.headers();
    console.log(
      "antwort:",
      response.status(),
      headers["content-type"],
      headers["content-range"] ?? "(ohne content-range)"
    );
  }
});
page.on("console", (message) => {
  if (message.type() === "error") console.log("konsole:", message.text());
});

await page.goto(`${BASE}/login`);
// Submitting before hydration would fall back to a native GET form post.
await page.waitForLoadState("networkidle");
await page.locator('input[name="username"]').fill("HasselWG");
await page.locator('input[name="password"]').fill("#RettetXoro");
await page.getByRole("button", { name: /anmelden/i }).click();
await page.waitForURL(`${BASE}/`);

await page.getByText("Methoden im Fokus").first().click();
const dialog = page.getByRole("dialog");
await dialog.waitFor();

const still = dialog.locator("video").first();
await still.waitFor({ state: "visible" });

const stillState = await still.evaluate(async (video) => {
  for (let i = 0; i < 100 && video.readyState < 2; i += 1) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  return {
    src: video.getAttribute("src"),
    readyState: video.readyState,
    duration: video.duration,
    currentTime: video.currentTime,
    videoWidth: video.videoWidth,
    videoHeight: video.videoHeight,
    error: video.error?.message ?? null,
  };
});
console.log("standbild:", stillState);
await dialog.screenshot({ path: "player-still.png" });

await dialog.getByRole("button", { name: /Video abspielen/ }).click();
await page.waitForTimeout(2500);

const playerState = await dialog.locator("video").first().evaluate((video) => ({
  controls: video.controls,
  controlsList: video.getAttribute("controlsList"),
  paused: video.paused,
  currentTime: video.currentTime,
  duration: video.duration,
  error: video.error?.message ?? null,
}));
console.log("player:", playerState);
await dialog.screenshot({ path: "player-playing.png" });

await browser.close();
