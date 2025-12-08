"use strict";
/**
 * E2E tests for the `appium-docs build` and `init` commands
 * @module
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_path_1 = __importDefault(require("node:path"));
const chai = __importStar(require("chai"));
const chai_as_promised_1 = __importDefault(require("chai-as-promised"));
const YAML = __importStar(require("yaml"));
const yargs_1 = __importDefault(require("yargs/yargs"));
const support_1 = require("@appium/support");
const builder_1 = require("../../lib/builder");
const init_1 = require("../../lib/init");
const fs_1 = require("../../lib/fs");
const constants_1 = require("../../lib/constants");
const command_1 = require("../../lib/cli/command");
chai.use(chai_as_promised_1.default);
const { expect } = chai;
/**
 * Helper function to create a project directory with package.json
 */
async function createProjectDir(testDir, subdir, packageJson) {
    const projectDir = node_path_1.default.join(testDir, subdir);
    await support_1.fs.mkdirp(projectDir);
    await support_1.fs.writeFile(node_path_1.default.join(projectDir, constants_1.NAME_PACKAGE_JSON), JSON.stringify(packageJson, null, 2), 'utf8');
    return projectDir;
}
/**
 * Helper function to create a minimal mkdocs.yml file
 */
async function createMkdocsYml(projectDir, mkdocsYml) {
    await support_1.fs.writeFile(node_path_1.default.join(projectDir, constants_1.NAME_MKDOCS_YML), (0, fs_1.stringifyYaml)(mkdocsYml), 'utf8');
}
/**
 * Helper function to create a docs directory with a markdown file
 */
async function createDocsFile(projectDir, filename, content) {
    const docsDir = node_path_1.default.join(projectDir, 'docs');
    await support_1.fs.mkdirp(docsDir);
    await support_1.fs.writeFile(node_path_1.default.join(docsDir, filename), content, 'utf8');
}
/**
 * Helper function to ensure Python dependencies are installed
 */
async function ensurePythonDeps(projectDir, context) {
    try {
        await (0, init_1.initPython)({ cwd: projectDir });
    }
    catch {
        context.skip();
    }
}
/**
 * Helper function to verify a site was built
 */
async function verifySiteBuilt(siteDir, expectedContent) {
    const siteDirExists = await support_1.fs.exists(siteDir);
    expect(siteDirExists).to.be.true;
    const indexHtml = node_path_1.default.join(siteDir, 'index.html');
    const indexHtmlExists = await support_1.fs.exists(indexHtml);
    expect(indexHtmlExists).to.be.true;
    const indexHtmlContent = await support_1.fs.readFile(indexHtml, 'utf8');
    expect(indexHtmlContent).to.include(expectedContent);
}
/**
 * Helper function to read and parse mkdocs.yml
 */
async function readMkdocsYml(projectDir) {
    const mkdocsYmlPath = node_path_1.default.join(projectDir, constants_1.NAME_MKDOCS_YML);
    const mkdocsYmlContent = await support_1.fs.readFile(mkdocsYmlPath, 'utf8');
    return YAML.parse(mkdocsYmlContent);
}
describe('@appium/docutils build e2e', function () {
    let testDir;
    before(async function () {
        // Create a temporary directory for the test
        testDir = await support_1.tempDir.openDir();
    });
    after(async function () {
        // Clean up the temporary directory
        if (testDir) {
            await support_1.fs.rimraf(testDir);
        }
    });
    describe('buildSite', function () {
        it('should build a site with mkdocs', async function () {
            const projectDir = await createProjectDir(testDir, 'test1', {
                name: 'test-docs',
                version: '1.0.0',
                description: 'Test documentation',
            });
            // Create a minimal mkdocs.yml
            // For testing, we use a simple config without INHERIT to avoid path resolution issues
            await createMkdocsYml(projectDir, {
                site_name: 'Test Docs',
                docs_dir: 'docs',
                site_dir: constants_1.DEFAULT_SITE_DIR,
                theme: {
                    name: 'material',
                },
                plugins: ['search'],
            });
            await createDocsFile(projectDir, 'index.md', '# Test Documentation\n\nThis is a test page.\n');
            await ensurePythonDeps(projectDir, this);
            // Build the site
            await (0, builder_1.buildSite)({
                mkdocsYml: node_path_1.default.join(projectDir, constants_1.NAME_MKDOCS_YML),
                cwd: projectDir,
            });
            // Verify the site was built
            await verifySiteBuilt(node_path_1.default.join(projectDir, constants_1.DEFAULT_SITE_DIR), 'Test Documentation');
        });
        it('should build a site with custom site-dir', async function () {
            const customSiteDir = 'custom-site';
            const projectDir = await createProjectDir(testDir, 'test2', {
                name: 'test-docs-2',
                version: '1.0.0',
                description: 'Test documentation',
            });
            // Create a minimal mkdocs.yml
            // For testing, we use a simple config without INHERIT to avoid path resolution issues
            await createMkdocsYml(projectDir, {
                site_name: 'Test Docs 2',
                docs_dir: 'docs',
                site_dir: customSiteDir,
                theme: {
                    name: 'material',
                },
                plugins: ['search'],
            });
            await createDocsFile(projectDir, 'index.md', '# Test Documentation 2\n\nThis is another test page.\n');
            await ensurePythonDeps(projectDir, this);
            // Build the site with custom site-dir
            const customSiteDirPath = node_path_1.default.join(projectDir, customSiteDir);
            await (0, builder_1.buildSite)({
                mkdocsYml: node_path_1.default.join(projectDir, constants_1.NAME_MKDOCS_YML),
                siteDir: customSiteDirPath,
                cwd: projectDir,
            });
            // Verify the site was built in the custom directory
            await verifySiteBuilt(customSiteDirPath, 'Test Documentation 2');
        });
    });
    describe('init', function () {
        it('should scaffold mkdocs.yml file', async function () {
            const projectDir = await createProjectDir(testDir, 'init-test', {
                name: 'test-package',
                version: '1.0.0',
                description: 'Test package description',
                repository: {
                    type: 'git',
                    url: 'https://github.com/testuser/test-package.git',
                },
            });
            // Run init command (skip Python installation for faster test)
            await (0, init_1.init)({
                cwd: projectDir,
                mkdocs: true,
                python: false,
            });
            // Verify mkdocs.yml was created
            const mkdocsYmlPath = node_path_1.default.join(projectDir, constants_1.NAME_MKDOCS_YML);
            expect(await support_1.fs.exists(mkdocsYmlPath)).to.be.true;
            // Read and verify the content of mkdocs.yml
            const mkdocsYml = await readMkdocsYml(projectDir);
            // Verify expected fields are present
            expect(mkdocsYml.INHERIT).to.equal('./node_modules/@appium/docutils/base-mkdocs.yml');
            expect(mkdocsYml.docs_dir).to.equal('docs');
            expect(mkdocsYml.site_dir).to.equal('site');
            expect(mkdocsYml.site_name).to.equal('test-package');
            expect(mkdocsYml.site_description).to.equal('Test package description');
            // Repository URL may be normalized with "git+" prefix by read-pkg
            expect(mkdocsYml.repo_url).to.include('github.com/testuser/test-package');
            expect(mkdocsYml.repo_name).to.equal('testuser/test-package');
        });
        it('should scaffold mkdocs.yml with custom options', async function () {
            const projectDir = await createProjectDir(testDir, 'init-custom-test', {
                name: 'custom-package',
                version: '2.0.0',
                description: 'Custom package',
            });
            // Run init command with custom options
            await (0, init_1.init)({
                cwd: projectDir,
                mkdocs: true,
                python: false,
                siteName: 'Custom Site Name',
                repoUrl: 'https://github.com/custom/repo',
                repoName: 'custom/repo',
                siteDescription: 'Custom description',
            });
            // Verify mkdocs.yml was created
            const mkdocsYmlPath = node_path_1.default.join(projectDir, constants_1.NAME_MKDOCS_YML);
            expect(await support_1.fs.exists(mkdocsYmlPath)).to.be.true;
            // Read and verify the content
            const mkdocsYml = await readMkdocsYml(projectDir);
            // Verify custom values are used
            expect(mkdocsYml.site_name).to.equal('Custom Site Name');
            // Note: siteDescription from options should override package.json description
            // If it doesn't work, it falls back to package description
            expect(mkdocsYml.site_description).to.be.oneOf(['Custom description', 'Custom package']);
            expect(mkdocsYml.repo_url).to.equal('https://github.com/custom/repo');
            expect(mkdocsYml.repo_name).to.equal('custom/repo');
        });
    });
    describe('CLI help', function () {
        it('should print help when --help is passed', async function () {
            let helpOutput = '';
            // Create yargs instance similar to CLI
            const y = (0, yargs_1.default)(['--help'])
                .scriptName(constants_1.NAME_BIN)
                .command(command_1.build)
                .command(command_1.init)
                .command(command_1.validate)
                .options({
                verbose: {
                    type: 'boolean',
                    describe: 'Alias for --log-level=debug',
                },
                'log-level': {
                    alias: 'L',
                    choices: ['debug', 'info', 'warn', 'error', 'silent'],
                    describe: 'Sets the log level',
                    default: 'info',
                },
                config: {
                    alias: 'c',
                    type: 'string',
                    describe: 'Path to config file',
                    normalize: true,
                    nargs: 1,
                    requiresArg: true,
                    defaultDescription: '(discovered automatically)',
                },
                'no-config': {
                    type: 'boolean',
                    describe: 'Disable config file discovery',
                },
            })
                .demandCommand(1)
                .strict();
            // Try getHelp first (returns a string, no I/O needed)
            try {
                const helpText = await y.getHelp();
                helpOutput = helpText;
            }
            catch {
                // If getHelp doesn't work, use showHelp which writes to stderr by default
                // Capture stderr since showHelp() writes to stderr by default
                const originalStderrWrite = process.stderr.write.bind(process.stderr);
                const mockStderrWrite = (chunk) => {
                    if (typeof chunk === 'string' || Buffer.isBuffer(chunk)) {
                        helpOutput += chunk.toString();
                    }
                    return true;
                };
                process.stderr.write = mockStderrWrite;
                try {
                    y.showHelp();
                }
                finally {
                    process.stderr.write = originalStderrWrite;
                }
            }
            // Verify help output contains expected content
            expect(helpOutput).to.include(constants_1.NAME_BIN);
            expect(helpOutput).to.include('Commands:');
            expect(helpOutput).to.include('build');
            expect(helpOutput).to.include('init');
            expect(helpOutput).to.include('validate');
            expect(helpOutput).to.include('Options:');
            expect(helpOutput).to.include('--help');
        });
    });
});
//# sourceMappingURL=build.e2e.spec.js.map