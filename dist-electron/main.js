"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/lib/prisma.ts
var prisma_exports = {};
__export(prisma_exports, {
  prisma: () => prisma
});
function getDatabasePath() {
  if (process.env.APPDATA) {
    const appDir = import_path3.default.join(
      process.env.APPDATA,
      "ak-software"
    );
    if (!import_fs3.default.existsSync(appDir)) {
      import_fs3.default.mkdirSync(appDir, {
        recursive: true
      });
    }
    return import_path3.default.join(
      appDir,
      "shop.db"
    );
  }
  return import_path3.default.join(
    process.cwd(),
    "database",
    "shop.db"
  );
}
var import_config, import_path3, import_fs3, import_client, dbPath, globalForPrisma, prisma;
var init_prisma = __esm({
  "src/lib/prisma.ts"() {
    "use strict";
    import_config = require("dotenv/config");
    import_path3 = __toESM(require("path"));
    import_fs3 = __toESM(require("fs"));
    import_client = require("@prisma/client");
    dbPath = getDatabasePath();
    console.log("Using database:", dbPath);
    process.env.DATABASE_URL = `file:${dbPath}`;
    globalForPrisma = globalThis;
    if (!import_fs3.default.existsSync(dbPath)) {
      import_fs3.default.writeFileSync(dbPath, "");
    }
    process.env.DATABASE_URL = `file:${dbPath}`;
    prisma = globalForPrisma.prisma ?? new import_client.PrismaClient({
      log: ["error"]
    });
    if (process.env.NODE_ENV !== "production") {
      globalForPrisma.prisma = prisma;
    }
  }
});

// src/lib/init-db.js
var require_init_db = __commonJS({
  "src/lib/init-db.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.initializeDatabase = initializeDatabase2;
    var client_1 = require("@prisma/client");
    var prisma_1 = (init_prisma(), __toCommonJS(prisma_exports));
    async function initializeDatabase2() {
      console.log(`Start seeding ...`);
      const existingSettings = await prisma_1.prisma.setting.count();
      if (existingSettings === 0) {
        await prisma_1.prisma.setting.create({
          data: {
            storeName: "Neural Slate SuperMart",
            storeAddress: "",
            storePhone: "+91 9876543210",
            storeEmail: "",
            invoicePrefix: "INV",
            taxPercentage: new client_1.Prisma.Decimal(0),
            currencySymbol: "\u20B9",
            thermalPaperWidth: "80mm",
            allowNegativeStock: false
          }
        });
        console.log(`Created default settings`);
      }
      const categories = [
        "Electronics",
        "Miscellaneous",
        "Hardware",
        "Tiles"
      ];
      for (const name of categories) {
        await prisma_1.prisma.category.upsert({
          where: { name },
          update: {},
          create: { name }
        });
      }
      console.log(`Created default categories`);
      console.log(`Seeding finished.`);
    }
  }
});

// electron/main.ts
var import_electron6 = require("electron");
var import_path4 = __toESM(require("path"));

// electron/ipc/printer.ipc.ts
var import_electron3 = require("electron");

// electron/printers/thermal-printer.ts
var import_electron = require("electron");
var ThermalPrinter = class {
  constructor() {
  }
  async printReceipt(htmlContent) {
    return new Promise((resolve) => {
      let win = new import_electron.BrowserWindow({
        show: false,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true
        }
      });
      win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);
      win.webContents.on("did-finish-load", () => {
        win.webContents.print({
          silent: true,
          printBackground: true
          // margins: { marginType: 'none' }, // Allow OS to handle default 80mm margins mostly
        }, (success, failureReason) => {
          if (!success) {
            console.error("Print failed:", failureReason);
            resolve({ success: false, error: failureReason });
          } else {
            resolve({ success: true });
          }
          win.close();
        });
      });
    });
  }
  async testPrint() {
    const testHtml = `
      <html>
        <body style="font-family: sans-serif; text-align: center;">
          <h2>Printer Test</h2>
          <p>If you can read this, your printer is working correctly.</p>
          <hr/>
          <p>Offline POS System</p>
        </body>
      </html>
    `;
    return this.printReceipt(testHtml);
  }
};

// electron/printers/a4-printer.ts
var import_electron2 = require("electron");
var A4Printer = class {
  constructor() {
  }
  async printInvoice(htmlContent) {
    return new Promise((resolve) => {
      let win = new import_electron2.BrowserWindow({
        show: false,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true
        }
      });
      win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);
      win.webContents.on("did-finish-load", () => {
        win.webContents.print({
          silent: true,
          printBackground: true,
          pageSize: "A4",
          margins: { marginType: "none" }
        }, (success, failureReason) => {
          if (!success) {
            console.error("A4 Print failed:", failureReason);
            resolve({ success: false, error: failureReason });
          } else {
            resolve({ success: true });
          }
          win.close();
        });
      });
    });
  }
};

// electron/ipc/printer.ipc.ts
function setupPrinterIpc() {
  const thermalPrinter = new ThermalPrinter();
  import_electron3.ipcMain.handle("print:thermal", async (event, payload) => {
    try {
      const result = await thermalPrinter.printReceipt(payload.html);
      return result;
    } catch (error) {
      console.error("Thermal print error:", error);
      return { success: false, error: error.message };
    }
  });
  const a4Printer = new A4Printer();
  import_electron3.ipcMain.handle("print:a4", async (event, payload) => {
    try {
      const result = await a4Printer.printInvoice(payload.html);
      return result;
    } catch (error) {
      console.error("A4 print error:", error);
      return { success: false, error: error.message };
    }
  });
  import_electron3.ipcMain.handle("print:test", async () => {
    try {
      const result = await thermalPrinter.testPrint();
      return result;
    } catch (error) {
      console.error("Test print error:", error);
      return { success: false, error: error.message };
    }
  });
}

// electron/ipc/backup.ipc.ts
var import_electron5 = require("electron");

// electron/backup/backup-manager.ts
var import_fs = __toESM(require("fs"));
var import_path = __toESM(require("path"));
var import_os = __toESM(require("os"));
var import_electron4 = require("electron");
var BackupManager = class {
  constructor() {
    this.dbPath = import_path.default.join(
      import_electron4.app.getPath("userData"),
      "shop.db"
    );
    this.backupDir = import_path.default.join(
      import_os.default.homedir(),
      "Desktop",
      "OfflinePOS_Backups"
    );
    if (!import_fs.default.existsSync(this.backupDir)) {
      import_fs.default.mkdirSync(this.backupDir, {
        recursive: true
      });
    }
    console.log(
      "Database path:",
      this.dbPath
    );
    console.log(
      "Backup directory:",
      this.backupDir
    );
  }
  async createBackup() {
    return new Promise(
      async (resolve) => {
        try {
          if (!import_fs.default.existsSync(this.dbPath)) {
            console.error(
              "Database not found:",
              this.dbPath
            );
            return resolve({
              success: false,
              error: "Database file not found."
            });
          }
          const dateStr = (/* @__PURE__ */ new Date()).toISOString().replace(/[:T]/g, "-").split(".")[0];
          const backupFileName = `pos_backup_${dateStr}.zip`;
          const backupFilePath = import_path.default.join(
            this.backupDir,
            backupFileName
          );
          const output = import_fs.default.createWriteStream(
            backupFilePath
          );
          const archiverModule = await import("archiver");
          const archiver = archiverModule.default;
          const archive = archiver(
            "zip",
            {
              zlib: {
                level: 9
              }
            }
          );
          output.on(
            "close",
            () => {
              console.log(
                "Backup created:",
                backupFilePath
              );
              resolve({
                success: true,
                filePath: backupFilePath
              });
            }
          );
          archive.on(
            "error",
            (err) => {
              console.error(
                "Archive error:",
                err
              );
              resolve({
                success: false,
                error: err.message
              });
            }
          );
          archive.pipe(output);
          archive.file(
            this.dbPath,
            {
              name: "shop.db"
            }
          );
          await archive.finalize();
        } catch (error) {
          console.error(
            "Backup failed:",
            error
          );
          resolve({
            success: false,
            error: error.message || "Backup failed"
          });
        }
      }
    );
  }
  async listBackups() {
    try {
      if (!import_fs.default.existsSync(
        this.backupDir
      )) {
        return [];
      }
      const files = import_fs.default.readdirSync(
        this.backupDir
      );
      return files.filter(
        (file) => file.endsWith(".zip")
      ).map((file) => {
        const fullPath = import_path.default.join(
          this.backupDir,
          file
        );
        const stats = import_fs.default.statSync(fullPath);
        return {
          name: file,
          path: fullPath,
          size: stats.size,
          createdAt: stats.birthtime
        };
      }).sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      );
    } catch (error) {
      console.error(
        "List backup error:",
        error
      );
      return [];
    }
  }
};

// electron/backup/restore-manager.ts
var import_fs2 = __toESM(require("fs"));
var import_path2 = __toESM(require("path"));
var import_extract_zip = __toESM(require("extract-zip"));
var RestoreManager = class {
  constructor(appPath) {
    this.dbPath = import_path2.default.join(appPath, "prisma", "dev.db");
  }
  async restoreBackup(zipPath) {
    return new Promise(async (resolve) => {
      try {
        if (!import_fs2.default.existsSync(zipPath)) {
          return resolve({ success: false, error: "Backup file not found." });
        }
        const tempDir = import_path2.default.join(import_path2.default.dirname(zipPath), "pos_temp_extract_" + Date.now());
        try {
          await (0, import_extract_zip.default)(zipPath, { dir: tempDir });
          const extractedDbPath = import_path2.default.join(tempDir, "dev.db");
          if (!import_fs2.default.existsSync(extractedDbPath)) {
            throw new Error("Invalid backup file. Missing dev.db.");
          }
          const currentBackupPath = this.dbPath + ".bak";
          if (import_fs2.default.existsSync(this.dbPath)) {
            import_fs2.default.copyFileSync(this.dbPath, currentBackupPath);
          }
          import_fs2.default.copyFileSync(extractedDbPath, this.dbPath);
          import_fs2.default.rmSync(tempDir, { recursive: true, force: true });
          resolve({ success: true });
        } catch (extractError) {
          if (import_fs2.default.existsSync(tempDir)) {
            import_fs2.default.rmSync(tempDir, { recursive: true, force: true });
          }
          resolve({ success: false, error: extractError.message });
        }
      } catch (error) {
        resolve({ success: false, error: error.message });
      }
    });
  }
};

// electron/ipc/backup.ipc.ts
function setupBackupIpc() {
  const userDataPath = import_electron5.app.getPath("userData");
  const backupManager = new BackupManager();
  const restoreManager = new RestoreManager(userDataPath);
  import_electron5.ipcMain.handle("backup:create", async () => {
    try {
      const result = await backupManager.createBackup();
      return result;
    } catch (error) {
      console.error("Backup create error:", error);
      return { success: false, error: error.message };
    }
  });
  import_electron5.ipcMain.handle("backup:list", async () => {
    try {
      return await backupManager.listBackups();
    } catch (error) {
      console.error("Backup list error:", error);
      return [];
    }
  });
  import_electron5.ipcMain.handle("backup:restore", async (event, filePath) => {
    try {
      let pathToRestore = filePath;
      if (!pathToRestore) {
        const { canceled, filePaths } = await import_electron5.dialog.showOpenDialog({
          properties: ["openFile"],
          filters: [{ name: "ZIP Archives", extensions: ["zip"] }]
        });
        if (canceled || filePaths.length === 0) {
          return { success: false, error: "Cancelled" };
        }
        pathToRestore = filePaths[0];
      }
      const result = await restoreManager.restoreBackup(pathToRestore);
      return result;
    } catch (error) {
      console.error("Restore error:", error);
      return { success: false, error: error.message };
    }
  });
}

// electron/main.ts
var import_init_db = __toESM(require_init_db());
var isDev = !import_electron6.app.isPackaged;
var mainWindow = null;
import_electron6.app.disableHardwareAcceleration();
import_electron6.app.commandLine.appendSwitch("disable-gpu");
import_electron6.app.commandLine.appendSwitch(
  "js-flags",
  "--max-old-space-size=4096"
);
function createWindow() {
  mainWindow = new import_electron6.BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    autoHideMenuBar: true,
    backgroundColor: "#ffffff",
    webPreferences: {
      preload: import_path4.default.join(
        __dirname,
        "preload.js"
      ),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });
  mainWindow.webContents.on(
    "did-fail-load",
    (_, code, desc) => {
      console.error(
        "Renderer failed:",
        code,
        desc
      );
    }
  );
  mainWindow.webContents.on(
    "console-message",
    (_, level, message) => {
      console.log(
        `Renderer [${level}]`,
        message
      );
    }
  );
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }
  if (isDev) {
    mainWindow.loadURL(
      "http://localhost:3000"
    );
  } else {
    mainWindow.loadURL(
      "http://127.0.0.1:3000"
    );
  }
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}
import_electron6.app.whenReady().then(async () => {
  setupPrinterIpc();
  setupBackupIpc();
  import_electron6.ipcMain.handle(
    "get-app-path",
    () => {
      return import_electron6.app.getAppPath();
    }
  );
  await (0, import_init_db.initializeDatabase)();
  createWindow();
  import_electron6.app.on("activate", () => {
    if (import_electron6.BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
}).catch((err) => {
  console.error(
    "Electron startup failed:",
    err
  );
});
import_electron6.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    import_electron6.app.quit();
  }
});
//# sourceMappingURL=main.js.map