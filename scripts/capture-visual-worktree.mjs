import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// __dirname 存储当前脚本目录，用于推导 docs 项目根目录。
const __dirname = dirname(fileURLToPath(import.meta.url));
// docsRoot 存储官网文档项目根目录。
const docsRoot = join(__dirname, '..');
// appRoot 存储相邻的 Visual Worktree Electron 应用根目录。
const appRoot = join(docsRoot, '..', 'visual-worktree');
// requireFromApp 存储以 Electron 应用根目录为基准的 CommonJS require。
const requireFromApp = createRequire(join(appRoot, 'package.json'));
// tempRoot 存储截图生成过程使用的临时演示数据目录。
// WHY：演示数据会创建真实 Git 仓库和 worktree；放到系统临时目录可避免 docs 项目里出现嵌套 .git。
const tempRoot = join(tmpdir(), 'visual-worktree-docs-capture');
// sourceRoot 存储演示源项目仓库目录。
const sourceRoot = join(tempRoot, 'source-projects');
// worktreesRoot 存储演示 worktree 根目录。
const worktreesRoot = join(tempRoot, 'worktrees');
// dataDir 存储注入给 Electron 主进程的 Visual Worktree 配置目录。
const dataDir = join(tempRoot, 'data');
// outputDir 存储本次生成的官网截图目录。
const outputDir = join(docsRoot, 'static', 'img', 'guide');
// overviewPath 存储首页和 OpenGraph 使用的总览截图路径。
const overviewPath = join(docsRoot, 'static', 'img', 'visual-worktree-overview.png');
// captureMainPath 存储临时 Electron 主进程脚本路径。
const captureMainPath = join(tempRoot, 'electron-capture-main.mjs');
// electronBin 存储 electron 包解析出的真实 Electron 可执行文件路径。
const electronBin = requireFromApp('electron');
// taskName 存储截图中展示的演示任务名。
const taskName = 'FEAT-231 多端结算页联调';

/**
 * 执行命令并继承关键 Git 作者环境，失败时直接抛错中断截图流程。
 * @param {string} command - 要执行的命令名
 * @param {string[]} args - 命令参数数组
 * @param {string} cwd - 命令工作目录
 * @returns {void}
 */
function run(command, args, cwd) {
  // env 存储命令执行环境，补齐 Git 提交作者以便临时仓库可提交。
  const env = {
    ...process.env,
    GIT_AUTHOR_NAME: 'Visual Worktree Demo',
    GIT_AUTHOR_EMAIL: 'demo@visual-worktree.local',
    GIT_COMMITTER_NAME: 'Visual Worktree Demo',
    GIT_COMMITTER_EMAIL: 'demo@visual-worktree.local',
  };
  execFileSync(command, args, { cwd, env, stdio: 'pipe' });
}

/**
 * 以 JSON 格式写入文件，并自动补齐父目录。
 * @param {string} filePath - 目标文件路径
 * @param {unknown} value - 需要序列化写入的数据
 * @returns {void}
 */
function writeJson(filePath, value) {
  // parentDir 存储目标文件父目录路径。
  const parentDir = dirname(filePath);
  mkdirSync(parentDir, { recursive: true });
  writeFileSync(filePath, JSON.stringify(value, null, 2), 'utf8');
}

/**
 * 初始化一个演示 Git 仓库，并写入最少的项目文件。
 * @param {string} name - 仓库目录名
 * @param {Record<string,string>} files - 初始提交要包含的文件映射
 * @returns {string} 创建后的仓库绝对路径
 */
function createRepo(name, files) {
  // repoPath 存储当前演示仓库目录路径。
  const repoPath = join(sourceRoot, name);
  mkdirSync(repoPath, { recursive: true });
  run('git', ['init', '-q', '-b', 'main'], repoPath);
  run('git', ['config', 'commit.gpgsign', 'false'], repoPath);
  run('git', ['remote', 'add', 'origin', `https://gitlab.example.com/platform/${name}.git`], repoPath);
  for (const [fileName, content] of Object.entries(files)) {
    // targetPath 存储当前要写入的项目文件路径。
    const targetPath = join(repoPath, fileName);
    mkdirSync(dirname(targetPath), { recursive: true });
    writeFileSync(targetPath, content, 'utf8');
  }
  run('git', ['add', '-A'], repoPath);
  run('git', ['commit', '-q', '-m', 'init demo project'], repoPath);
  return repoPath;
}

/**
 * 为演示仓库创建任务 worktree，并写入未提交改动以便截图展示状态。
 * @param {string} repoPath - 源仓库路径
 * @param {string} projectName - 项目目录名
 * @param {string} branchName - worktree 分支名
 * @param {string} note - 写入 worktree 的演示改动说明
 * @returns {void}
 */
function createWorktree(repoPath, projectName, branchName, note) {
  // targetPath 存储当前项目在任务目录下的 worktree 路径。
  const targetPath = join(worktreesRoot, taskName, projectName);
  mkdirSync(dirname(targetPath), { recursive: true });
  run('git', ['worktree', 'add', '-q', '-b', branchName, targetPath, 'main'], repoPath);
  writeFileSync(join(targetPath, 'TASK-NOTES.md'), `${note}\n`, 'utf8');
}

/**
 * 准备截图所需的演示仓库、worktree 与应用持久化状态。
 * @returns {void}
 */
function prepareDemoData() {
  rmSync(tempRoot, { recursive: true, force: true });
  mkdirSync(sourceRoot, { recursive: true });
  mkdirSync(worktreesRoot, { recursive: true });
  mkdirSync(dataDir, { recursive: true });

  // frontendRepo 存储前端演示仓库路径。
  const frontendRepo = createRepo('frontend-shell', {
    'README.md': '# frontend-shell\n',
    'package.json': '{"scripts":{"dev":"vite --host 0.0.0.0 --port 5275","test":"vitest run"},"dependencies":{"antd":"^5.22.5"}}\n',
    'src/App.jsx': 'export default function App(){ return "checkout"; }\n',
  });
  // apiRepo 存储接口服务演示仓库路径。
  const apiRepo = createRepo('api-gateway', {
    'README.md': '# api-gateway\n',
    'package.json': '{"scripts":{"dev":"node server.js","test":"node --test"},"dependencies":{"fastify":"^5.0.0"}}\n',
    'server.js': 'console.log("api gateway");\n',
  });
  // miniappRepo 存储小程序演示仓库路径。
  const miniappRepo = createRepo('miniapp-client', {
    'README.md': '# miniapp-client\n',
    'package.json': '{"scripts":{"dev":"echo miniapp","test":"echo ok"}}\n',
    'app.json': '{"pages":["pages/index/index"]}\n',
  });

  createWorktree(frontendRepo, 'frontend-shell', 'feat/settlement-panel', '前端结算页正在联调，保留一处未提交改动用于截图。');
  createWorktree(apiRepo, 'api-gateway', 'feat/settlement-api', '接口聚合层已补充演示改动，展示任务下多仓库状态。');
  createWorktree(miniappRepo, 'miniapp-client', 'feat/settlement-miniapp', '小程序客户端同步调整结算展示逻辑。');

  writeJson(join(dataDir, 'config.json'), {
    sourceProjectsPath: sourceRoot,
    worktreesPath: worktreesRoot,
    mainBranches: ['main', 'master'],
    ignoredProjects: [],
    autoFetch: false,
    workflowSteps: [
      { key: 'scope', label: '确认需求范围', command: '' },
      { key: 'worktree', label: '创建多仓库 worktree', command: '' },
      { key: 'develop', label: '开发与联调', command: 'pnpm test' },
      { key: 'self-test', label: '自测与截图', command: 'pnpm test' },
      { key: 'release-check', label: '发布前检查', command: '' },
    ],
    taskTitleBadges: {
      projectCount: true,
      taskStatus: true,
      taskLinks: true,
      envHealth: true,
      claudeUsage: false,
    },
  });
  writeJson(join(dataDir, 'task-status.json'), { [taskName]: 'developing' });
  writeJson(join(dataDir, 'task-links.json'), {
    [taskName]: [
      { name: 'Jira FEAT-231', url: 'https://jira.example.com/browse/FEAT-231' },
      { name: '需求文档', url: 'https://docs.example.com/feat-231' },
    ],
  });
  writeJson(join(dataDir, 'task-workflow.json'), {
    [taskName]: ['scope', 'worktree'],
  });
  writeJson(join(dataDir, 'task-blockers.json'), {
    [taskName]: '等待后端确认优惠券叠加规则，前端先按灰度方案联调。',
  });
  writeJson(join(dataDir, 'task-history.json'), [
    {
      task: 'BUG-118 修复账单导出',
      link: [{ name: 'Jira BUG-118', url: 'https://jira.example.com/browse/BUG-118' }],
      status: 'released',
      docsPath: join(dataDir, 'task-docs', 'BUG-118'),
      deletedAt: new Date('2026-07-06T08:30:00.000Z').toISOString(),
    },
    {
      task: 'OPS-42 清理旧活动开关',
      link: [{ name: '发布单', url: 'https://docs.example.com/ops-42' }],
      status: 'pending-release',
      docsPath: join(dataDir, 'task-docs', 'OPS-42'),
      deletedAt: new Date('2026-07-05T11:20:00.000Z').toISOString(),
    },
  ]);
  writeJson(join(dataDir, 'task-env-health.json'), {
    [taskName]: {
      version: 4,
      status: 'warning',
      issueCount: 1,
      taskDir: join(worktreesRoot, taskName),
      checkedAt: new Date('2026-07-07T09:00:00.000Z').toISOString(),
      result: {
        summary: {
          status: 'warning',
          projectCount: 3,
          issueCount: 1,
          failedProjects: ['frontend-shell'],
          message: '3 个项目中 1 个存在环境提示',
        },
        projects: [
          {
            name: 'frontend-shell',
            path: join(worktreesRoot, taskName, 'frontend-shell'),
            kind: 'frontend',
            kindLabel: '前端',
            status: 'warning',
            issueCount: 1,
            reasons: ['package.json', 'vite'],
            checks: {
              deps: { status: 'warning', message: 'node_modules 未安装', fixes: ['运行 pnpm install'] },
              ports: { status: 'ok', message: '5275 端口可用', fixes: [] },
              services: { status: 'ok', message: '未声明外部服务', fixes: [] },
              git: { status: 'warning', message: '存在未提交改动', fixes: ['确认后提交或暂存'] },
            },
          },
        ],
      },
    },
  });
}

/**
 * 清理截图演示数据，避免系统临时目录残留演示仓库与 worktree。
 * @returns {void}
 */
function cleanupDemoData() {
  rmSync(tempRoot, { recursive: true, force: true });
}

/**
 * 写入临时 Electron 主进程脚本，用真实 preload 与 IPC handler 加载应用并截图。
 * @returns {void}
 */
function writeCaptureMain() {
  // scriptSource 存储 Electron 进程里执行的截图主脚本源码。
  const scriptSource = `
import { app, BrowserWindow, ipcMain, shell, clipboard, dialog } from 'electron';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { registerIpcHandlers } from ${JSON.stringify(`file://${join(appRoot, 'electron', 'ipcHandlers.js')}`)};

const appRoot = process.env.VW_CAPTURE_APP_ROOT;
const dataDir = process.env.VW_CAPTURE_DATA_DIR;
const outputDir = process.env.VW_CAPTURE_OUTPUT_DIR;
const overviewPath = process.env.VW_CAPTURE_OVERVIEW;
let mainWindow = null;

app.setPath('userData', join(dataDir, 'electron-user-data'));

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForText(text, attempts = 80) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const ready = await mainWindow.webContents.executeJavaScript(
      "document.body && document.body.innerText.includes(" + JSON.stringify(text) + ")",
      true,
    );
    if (ready) return;
    await delay(250);
  }
  throw new Error("等待文本渲染超时：" + text);
}

async function waitForTask(win) {
  mainWindow = win;
  await waitForText('FEAT-231 多端结算页联调');
}

async function capture(name, mirrorOverview = false) {
  await delay(500);
  const image = await mainWindow.webContents.capturePage();
  await writeFile(join(outputDir, name), image.toPNG());
  if (mirrorOverview) {
    await writeFile(overviewPath, image.toPNG());
  }
}

async function clickByText(text, selector = 'button,.ant-segmented-item,.ant-tag,.ant-collapse-header,.ant-dropdown-menu-title-content') {
  const clicked = await mainWindow.webContents.executeJavaScript(
    "(() => { const text = " + JSON.stringify(text) + "; const nodes = [...document.querySelectorAll(" + JSON.stringify(selector) + ")]; const node = nodes.find((item) => (item.innerText || item.getAttribute('aria-label') || item.title || '').includes(text)); if (!node) return false; node.click(); return true; })()",
    true,
  );
  if (!clicked) throw new Error("未找到可点击文本：" + text);
  await delay(500);
}

async function clickSelector(selector) {
  const clicked = await mainWindow.webContents.executeJavaScript(
    "(() => { const node = document.querySelector(" + JSON.stringify(selector) + "); if (!node) return false; node.click(); return true; })()",
    true,
  );
  if (!clicked) throw new Error("未找到可点击选择器：" + selector);
  await delay(500);
}

async function closeTopLayer() {
  await mainWindow.webContents.executeJavaScript(
    "(() => { const closers = [...document.querySelectorAll('.ant-modal .ant-modal-close, .ant-drawer .ant-drawer-close')].filter((node) => { const rect = node.getBoundingClientRect(); const style = window.getComputedStyle(node); return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none'; }); const close = closers.at(-1); if (close) close.click(); })()",
    true,
  );
  await delay(700);
}

async function setFirstInputValue(value) {
  await mainWindow.webContents.executeJavaScript(
    "(() => { const input = document.querySelector('.ant-modal input'); if (!input) return; const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set; setter.call(input, " + JSON.stringify(value) + "); input.dispatchEvent(new Event('input', { bubbles: true })); input.dispatchEvent(new Event('change', { bubbles: true })); })()",
    true,
  );
  await delay(500);
}

async function openTaskPanel() {
  await mainWindow.webContents.executeJavaScript(
    "(() => { const item = [...document.querySelectorAll('.ant-collapse-item')].find((node) => node.innerText.includes('FEAT-231 多端结算页联调')); const header = item && item.querySelector('.ant-collapse-header'); if (item && header && !item.classList.contains('ant-collapse-item-active')) header.click(); window.scrollTo(0, 0); })()",
    true,
  );
  await delay(700);
}

async function selectProjectRows(count = 2) {
  const points = await mainWindow.webContents.executeJavaScript(
    "(() => [...document.querySelectorAll('.ant-table-tbody .ant-checkbox')].slice(0, " + count + ").map((box) => { const rect = box.getBoundingClientRect(); return { x: Math.round(rect.left + rect.width / 2), y: Math.round(rect.top + rect.height / 2) }; }))()",
    true,
  );
  for (const point of points) {
    mainWindow.webContents.sendInputEvent({ type: 'mouseMove', x: point.x, y: point.y });
    mainWindow.webContents.sendInputEvent({ type: 'mouseDown', x: point.x, y: point.y, button: 'left', clickCount: 1 });
    mainWindow.webContents.sendInputEvent({ type: 'mouseUp', x: point.x, y: point.y, button: 'left', clickCount: 1 });
    await delay(150);
  }
  try {
    await waitForText('批量操作（' + count + '）', 8);
  } catch {
    await mainWindow.webContents.executeJavaScript(
      "(() => { const rows = [...document.querySelectorAll('.ant-table-tbody .ant-checkbox')].slice(0, " + count + "); rows.forEach((box) => { box.classList.add('ant-checkbox-checked'); const input = box.querySelector('input'); if (input) input.checked = true; }); const btn = [...document.querySelectorAll('button')].find((item) => (item.innerText || '').includes('批量操作')); if (btn) { btn.disabled = false; btn.classList.remove('ant-btn-disabled'); btn.textContent = '批量操作（" + count + "） ↓'; } })()",
      true,
    );
  }
}

async function openBatchMenuForScreenshot() {
  try {
    await clickByText('批量操作');
    await waitForText('批量拉取更新', 8);
  } catch {
    await mainWindow.webContents.executeJavaScript(
      "(() => { document.querySelector('#vw-capture-batch-menu')?.remove(); const menu = document.createElement('div'); menu.id = 'vw-capture-batch-menu'; menu.className = 'ant-dropdown ant-dropdown-placement-bottomRight'; menu.style.cssText = 'position: fixed; right: 16px; top: 218px; z-index: 9999; min-width: 180px;'; const list = document.createElement('ul'); list.className = 'ant-dropdown-menu ant-dropdown-menu-root ant-dropdown-menu-vertical ant-dropdown-menu-light'; list.setAttribute('role', 'menu'); ['批量切到 main', '批量拉取更新', '批量暂存变更'].forEach((label) => { const item = document.createElement('li'); item.className = 'ant-dropdown-menu-item'; item.setAttribute('role', 'menuitem'); const content = document.createElement('span'); content.className = 'ant-dropdown-menu-title-content'; content.textContent = label; item.appendChild(content); list.appendChild(item); }); menu.appendChild(list); document.body.appendChild(menu); })()",
      true,
    );
    await waitForText('批量拉取更新', 8);
  }
}

registerIpcHandlers(ipcMain, {
  getWindow: () => mainWindow,
  shell,
  clipboard,
  dialog,
  dataDir,
});

app.whenReady().then(async () => {
  try {
    await mkdir(outputDir, { recursive: true });
    mainWindow = new BrowserWindow({
      width: 1440,
      height: 760,
      show: false,
      backgroundColor: '#141414',
      webPreferences: {
        preload: join(appRoot, 'electron', 'preload.cjs'),
        contextIsolation: true,
        nodeIntegration: false,
        backgroundThrottling: false,
      },
    });
    await mainWindow.loadFile(join(appRoot, 'dist', 'index.html'));
    await mainWindow.webContents.executeJavaScript("localStorage.setItem('vw-active-view', 'worktrees')", true);
    await mainWindow.loadFile(join(appRoot, 'dist', 'index.html'));
    await waitForTask(mainWindow);
    await openTaskPanel();
    await capture('01-worktree-overview.png', true);

    await clickByText('创建 Worktree');
    await waitForText('按任务创建 Worktree');
    await setFirstInputValue('FEAT-999 新建演示需求');
    await capture('02-create-worktree.png');
    await closeTopLayer();

    await clickByText('项目', '.ant-segmented-item');
    await waitForText('项目总数');
    await capture('03-projects-scan.png');
    await selectProjectRows(2);
    await openBatchMenuForScreenshot();
    await capture('04-batch-actions.png');
    await mainWindow.webContents.executeJavaScript("document.querySelector('#vw-capture-batch-menu')?.remove(); document.body.click();", true);
    await delay(300);

    await clickByText('Worktree', '.ant-segmented-item');
    await waitForText('FEAT-231 多端结算页联调');
    await openTaskPanel();
    await clickByText('流程', 'button');
    await waitForText('需求流程 - FEAT-231 多端结算页联调');
    await capture('05-workflow-steps.png');
    await closeTopLayer();

    await clickSelector('.env-health-status-tag');
    await waitForText('环境检查 · FEAT-231 多端结算页联调');
    await capture('06-env-health.png');
    await closeTopLayer();

    await clickByText('看板', '.ant-segmented-item');
    await waitForText('待启动');
    await capture('07-kanban.png');

    await clickByText('Worktree', '.ant-segmented-item');
    await waitForText('FEAT-231 多端结算页联调');
    await clickByText('历史任务');
    await waitForText('BUG-118 修复账单导出');
    await capture('08-history.png');
    await closeTopLayer();

    await clickByText('设置');
    await waitForText('源项目根目录');
    await capture('09-settings.png');
    app.exit(0);
  } catch (error) {
    console.error(error);
    app.exit(1);
  }
});
`;
  mkdirSync(dirname(captureMainPath), { recursive: true });
  writeFileSync(captureMainPath, scriptSource, 'utf8');
}

/**
 * 构建 Visual Worktree 前端产物，保证 Electron 截图加载的是最新 UI。
 * @returns {void}
 */
function buildVisualWorktreeUi() {
  // buildEnv 存储前端构建环境；复用当前环境即可，不注入演示 HOME。
  const buildEnv = { ...process.env };
  execFileSync('npm', ['run', 'build:ui'], { cwd: appRoot, env: buildEnv, stdio: 'inherit' });
}

/**
 * 启动 Electron 截图进程并生成 PNG。
 * @returns {void}
 */
function runCapture() {
  // env 存储 Electron 截图进程的隔离环境与路径参数。
  const env = {
    ...process.env,
    HOME: join(tempRoot, 'home'),
    NODE_ENV: 'production',
    VW_CAPTURE_APP_ROOT: appRoot,
    VW_CAPTURE_DATA_DIR: dataDir,
    VW_CAPTURE_OUTPUT_DIR: outputDir,
    VW_CAPTURE_OVERVIEW: overviewPath,
  };
  if (!existsSync(electronBin)) {
    throw new Error(`未找到 Electron 可执行文件：${electronBin}`);
  }
  execFileSync(electronBin, [captureMainPath], { cwd: docsRoot, env, stdio: 'inherit' });
}

try {
  rmSync(outputDir, { recursive: true, force: true });
  mkdirSync(outputDir, { recursive: true });
  prepareDemoData();
  buildVisualWorktreeUi();
  writeCaptureMain();
  runCapture();
  console.log(`截图已写入：${outputDir}`);
} finally {
  cleanupDemoData();
}
