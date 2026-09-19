import { existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

if (!process.env.QVAC_CONFIG_PATH) {
  process.env.QVAC_CONFIG_PATH = join(root, "qvac.config.json");
}

if (!process.env.QVAC_RPC_INIT_TIMEOUT_MS) {
  process.env.QVAC_RPC_INIT_TIMEOUT_MS = "30000";
}

if (process.platform === "linux") {
  const vendor = join(root, "vendor", "linux-x64");
  if (existsSync(join(vendor, "libvulkan.so.1"))) {
    const prev = process.env.LD_LIBRARY_PATH ?? "";
    const parts = prev.split(":").filter(Boolean);
    if (!parts.includes(vendor)) {
      process.env.LD_LIBRARY_PATH = parts.length
        ? `${vendor}:${prev}`
        : vendor;
    }
  }
}
