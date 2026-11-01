// Chụp ảnh cảnh 3D để tự kiểm tra (headless Chromium + SwiftShader). Dùng chung cho các phiên chibi.
// 1) Chạy dev server:  npx vite --port 5174 --strictPort web   (chạy nền)
// 2) node scripts/shot.cjs '<json>'   — ví dụ:
//    node scripts/shot.cjs '{"out":"/tmp/a.png","x":4.6,"z":29.4,"yaw":0,"pitch":0.05,"dist":2.2,"hidePlayer":true}'
// Tham số: out, x, z (vị trí người chơi), yaw/pitch/dist (camera bám người chơi; yaw 0 = nhìn về -z, phía chính
// điện), hidePlayer, hideHud (mặc định true), night (giờ VN 21h), waitMs, width, height,
// pose {"tieuan":"sit"} (ép tư thế; bật runtime.debug.freezeNpc để Tiểu An không tự đổi tư thế),
// eval (chuỗi JS chạy trong trang sau khi vào chùa; nạp module bằng `await __imp("/src/...")`,
// KHÔNG dùng import() trực tiếp vì Vite có thể phục vụ module đã sửa kèm ?t=... → khác instance).
/* global window, performance, URL -- dùng trong page.evaluate (chạy trong trình duyệt) */
const fs = require("fs");
const { chromium } = require("playwright");
// Cloud session: Chromium cài sẵn ở /opt/pw-browsers/chromium (khác phiên bản Playwright của dự án).
const PRESET = process.env.CHROMIUM_PATH || "/opt/pw-browsers/chromium";
const o = JSON.parse(process.argv[2] || "{}");
(async () => {
  const browser = await chromium.launch({
    args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
    ...(fs.existsSync(PRESET) ? { executablePath: PRESET } : {}),
  });
  const page = await browser.newPage({
    viewport: { width: o.width ?? 900, height: o.height ?? 700 },
    deviceScaleFactor: o.scale ?? 1,
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error" && !m.text().startsWith("Failed to load resource"))
      errors.push(m.text());
  });
  page.on("response", (r) => r.status() >= 400 && errors.push(`${r.status()} ${r.url()}`));
  if (o.night) await page.clock.setFixedTime(new Date("2026-11-01T14:00:00Z"));
  await page.goto(o.url ?? "http://localhost:5174/", { waitUntil: "networkidle" });
  await page.click("text=Vào chùa");
  await page.waitForTimeout(1500);
  // Vite thêm ?t=... vào module đã sửa: import đúng URL trang đang dùng để có cùng instance module.
  await page.evaluate(() => {
    window.__imp = (p) => {
      const urls = performance
        .getEntriesByType("resource")
        .map((r) => r.name)
        .filter((n) => new URL(n).pathname === p);
      return import(urls.length ? urls[urls.length - 1] : p);
    };
  });
  await page.evaluate(async (o) => {
    const rt = await window.__imp("/src/state/runtime.ts");
    if (o.pose) {
      rt.debug.freezeNpc = true;
      for (const [id, pose] of Object.entries(o.pose)) rt.setPose(id, pose);
    }
    const g = rt.player.group;
    if (g && o.x !== undefined) g.position.set(o.x, 0, o.z ?? 0);
    if (g && o.hidePlayer) g.visible = false;
    Object.assign(rt.cam, {
      yaw: o.yaw ?? rt.cam.yaw,
      pitch: o.pitch ?? rt.cam.pitch,
      dist: o.dist ?? rt.cam.dist,
    });
    if (o.eval) await new Function(`return (async () => { ${o.eval} })()`)();
  }, o);
  await page.waitForTimeout(o.waitMs ?? 2500);
  if (o.hideHud !== false)
    await page.evaluate(() =>
      document
        .querySelectorAll(".hud,#hint,#companion,#toast,#joy,#leave")
        .forEach((e) => (e.style.display = "none")),
    );
  await page.screenshot({ path: o.out ?? "shot.png" });
  await browser.close();
  console.log(errors.length ? "ERRORS:\n" + errors.join("\n") : "ok, no page errors");
})();
