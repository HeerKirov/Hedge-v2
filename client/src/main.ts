import { createApplication } from "./application"
import { argvContains, argvGet } from "./utils/parameters"

createApplication({
    debugMode: argvContains(process.argv, "--debug-mode"),
    debugFrontendURL: argvGet(process.argv, "--debug-frontend-url", "http://localhost:3000"),
    debugFrontendIndex: argvGet(process.argv, "--debug-frontend-index", "../frontend/dist/index.html"),
    debugAppDataFolder: argvGet(process.argv, "--debug-appdata-folder", "./debug-appdata"),
    debugServerTarget: argvGet(process.argv, "--debug-server-target", "../server/target/debug/hedge-v2-server")
})
