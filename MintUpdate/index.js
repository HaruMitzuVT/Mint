import fs from "fs";
import path from "path";
import https from "https";
import { execSync } from "child_process";

const CONFIG = {
    SERVER: "https://192.168.1.254/Mint/Images",
    DOWNLOAD_DIR: "/opt/Mint-Updater",
    SINGAPURA_DIR: "/opt/Singapura",
    BRIDGE_DIR: "/opt/Bridge",
    CHECK_INTERVAL: 60_000 // 1 min
};

class MintUpdater {

    async start() {
        this.ensureDirs();
        console.log("[Updater] Started");

        while (true) {
            try {
                await this.checkUpdates();
            } catch (e) {
                console.error("[Updater] Error:", e.message);
            }
            await this.sleep(CONFIG.CHECK_INTERVAL);
        }
    }

    ensureDirs() {
        if (!fs.existsSync(CONFIG.DOWNLOAD_DIR)) {
            fs.mkdirSync(CONFIG.DOWNLOAD_DIR, { recursive: true });
        }
    }

    async checkUpdates() {
        const repo = await this.fetchJSON(`${CONFIG.SERVER}/repo.json`);

        const imageUpdated = await this.handleImage(repo.LastImage);
        const bridgeUpdated = await this.handleBridge(repo.LastBridge);

        if (imageUpdated || bridgeUpdated) {
            console.log("[Updater] Update applied successfully");
        }
    }

    async handleImage(remoteImage) {
        if (!remoteImage) return false;

        const localTag = this.getLocalVersion(CONFIG.SINGAPURA_DIR);
        if (localTag === remoteImage) return false;

        console.log("[Updater] New Singapura image detected");

        const tarPath = await this.download(remoteImage);
        this.remove(CONFIG.SINGAPURA_DIR);
        this.extract(tarPath, CONFIG.SINGAPURA_DIR);

        execSync(`chmod +x ${CONFIG.SINGAPURA_DIR}/singapura`);
        execSync(`chmod -R 777 ${CONFIG.SINGAPURA_DIR}`);

        this.saveLocalVersion(CONFIG.SINGAPURA_DIR, remoteImage);
        return true;
    }

async handleBridge(remoteBridge) {
    if (!remoteBridge) return false;

    const localTag = this.getLocalVersion(CONFIG.BRIDGE_DIR);
    if (localTag === remoteBridge) return false;

    console.log("[Updater] New Bridge detected");

    const binPath = await this.download(remoteBridge);

    // Eliminar instalación anterior
    this.remove(CONFIG.BRIDGE_DIR);
    fs.mkdirSync(CONFIG.BRIDGE_DIR, { recursive: true });

    const target = `${CONFIG.BRIDGE_DIR}/bridge`;

    fs.copyFileSync(binPath, target);

    execSync(`chmod +x ${target}`);
    execSync(`chmod -R 777 ${CONFIG.BRIDGE_DIR}`);

    this.saveLocalVersion(CONFIG.BRIDGE_DIR, remoteBridge);

    console.log("[Updater] Bridge installed");
    return true;
}


    async download(relativePath) {
        const url = `${CONFIG.SERVER}/${relativePath}`;
        const target = path.join(CONFIG.DOWNLOAD_DIR, path.basename(relativePath));

        console.log(`[Updater] Downloading ${url}`);
        await this.fetchFile(url, target);

        return target;
    }

    extract(tar, dest) {
        execSync(`mkdir -p ${dest}`);
        execSync(`tar -xf ${tar} -C ${dest}`);
    }

    remove(dir) {
        if (fs.existsSync(dir)) {
            execSync(`rm -rf ${dir}`);
        }
    }

    getLocalVersion(dir) {
        const vfile = path.join(dir, ".version");
        if (!fs.existsSync(vfile)) return null;
        return fs.readFileSync(vfile, "utf8").trim();
    }

    saveLocalVersion(dir, version) {
        fs.writeFileSync(path.join(dir, ".version"), version);
    }

    fetchJSON(url) {
    return new Promise((resolve, reject) => {
        https.get(url, res => {

            const { statusCode, headers } = res;
            let data = "";

            res.on("data", c => data += c);

            res.on("end", () => {
                if (statusCode !== 200) {
                    return reject(
                        new Error(`HTTP ${statusCode}: ${data.slice(0,200)}`)
                    );
                }

                if (!headers["content-type"]?.includes("application/json")) {
                    return reject(
                        new Error("Response is not JSON")
                    );
                }

                resolve(JSON.parse(data));
            });

        }).on("error", reject);
    });
}


    fetchFile(url, dest) {
        return new Promise((resolve, reject) => {
            const file = fs.createWriteStream(dest);
            https.get(url, res => {
                res.pipe(file);
                file.on("finish", () => file.close(resolve));
            }).on("error", err => {
                fs.unlinkSync(dest);
                reject(err);
            });
        });
    }

    sleep(ms) {
        return new Promise(r => setTimeout(r, ms));
    }
}

new MintUpdater().start();
