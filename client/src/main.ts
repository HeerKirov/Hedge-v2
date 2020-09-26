import { createApplication } from "./application"
import { argvContains, argvGet } from "./utils/parameters"

createApplication({
    developmentMode: argvContains(process.argv, "--development-mode"),
    developmentFrontendURL: argvGet(process.argv, "--development-frontend-url", "http://localhost:3000")
})
