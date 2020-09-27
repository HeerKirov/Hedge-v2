import { createApplication } from "./application"
import { argvContains, argvGet } from "./utils/parameters"

createApplication({
    debugMode: argvContains(process.argv, "--debug-mode"),
    debugFrontendURL: argvGet(process.argv, "--debug-frontend-url", "http://localhost:3000"),
    debugFrontendFile: argvGet(process.argv, "--debug-frontend-file", "../frontend/dist/index.html")
})
