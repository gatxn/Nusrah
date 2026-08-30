// Must run before `ws` is loaded anywhere (lib/db.ts imports it for Neon's
// WebSocket driver). Without this, ws's native buffer-masking addon breaks
// under this server's old glibc + Next's bundling, throwing
// "TypeError: b.mask is not a function" and taking down auth/DB requests.
// Setting it here (rather than as a cPanel env var) survives panel resets.
process.env.WS_NO_BUFFER_UTIL = "1";

const { createServer } = require("http");
const next = require("next");

const port = parseInt(process.env.PORT || "3000", 10);
const app = next({ dev: false });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => handle(req, res)).listen(port, () => {
    console.log(`Nusrah listening on port ${port}`);
  });
});
