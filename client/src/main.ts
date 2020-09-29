import { createApplication } from "./application"
import { createParameters } from "./utils/parameters"

const parameters = createParameters(process.argv)

createApplication({
    debugMode: parameters.contains("--debug-mode"),
    debugFrontendURL: parameters.opt("--debug-frontend-url"),
    debugAppDataFolder: parameters.opt("--debug-appdata-folder")
})
