import nodeFs, { Dirent, Mode } from "fs"
import unzipper from "unzipper"
import { exec, spawn } from "child_process"
import { promisify } from "util";

export function writeFile<T>(file: string, data: T): Promise<T> {
    return new Promise(((resolve, reject) => {
        nodeFs.writeFile(file, JSON.stringify(data), {encoding: "utf8"}, e => {
            if(e) {
                reject(e)
            }else{
                resolve(data)
            }
        })
    }))
}

export function appendFileStr(file: string, data: string): Promise<void> {
    return new Promise(((resolve, reject) => {
        nodeFs.appendFile(file, data, {encoding: "utf8"}, e => {
            if(e) {
                reject(e)
            }else{
                resolve()
            }
        })
    }))
}

export async function readFile<T>(file: string): Promise<T | null> {
    if(!await existsFile(file)) {
        return null
    }
    return new Promise(((resolve, reject) => {
        nodeFs.readFile(file, {encoding: "utf8"}, (e, data) => {
            if(e) {
                reject(e)
            }else{
                resolve(JSON.parse(data) as T)
            }
        })
    }))
}

export async function readFileStr(file: string): Promise<string | null> {
    if(!await existsFile(file)) {
        return null
    }
    return new Promise(((resolve, reject) => {
        nodeFs.readFile(file, {encoding: "utf8"}, (e, data) => {
            if(e) {
                reject(e)
            }else{
                resolve(data)
            }
        })
    }))
}

export function existsFile(path: string): Promise<boolean> {
    return new Promise((resolve => nodeFs.access(path, (e) => resolve(!e))))
}

export async function readdir(dir: string): Promise<Dirent[]> {
    return new Promise((resolve, reject) => {
        nodeFs.readdir(dir, {withFileTypes: true}, (e, files) => {
            if(e) {
                reject(e)
            }else{
                resolve(files)
            }
        })
    })
}

export async function mkdir(path: string): Promise<void> {
    if(await existsFile(path)) {
        return
    }
    return new Promise(((resolve, reject) => {
        nodeFs.mkdir(path, {recursive: true}, e => {
            if(e) {
                reject(e)
            }else{
                resolve()
            }
        })
    }))
}

export async function rmdir(path: string): Promise<void> {
    if(!await existsFile(path)) {
        return
    }
    await promisify(exec)(`rm -rf ${path}`)
}

export function cpR(src: string, dest: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const s = spawn("cp", ["-r", src, dest])
        s.on('close', code => {
            if(code === 0) {
                resolve()
            }else{
                reject(new Error("cp -r throws an error."))
            }
        })
    })
}

export function unzip(src: string, dest: string): Promise<void> {
    return new Promise((resolve, reject) => {
        nodeFs.createReadStream(src)
            .pipe(unzipper.Extract({path: dest}))
            .on('close', resolve)
            .on('error', reject)
    })
}

export function rename(src: string, dest: string): Promise<void> {
    return new Promise((resolve, reject) => {
        nodeFs.rename(src, dest, (e) => {
            if(e) {
                reject(e)
            }else{
                resolve()
            }
        })
    })
}

export function chmod(dest: string, mode: Mode): Promise<void> {
    return new Promise((resolve, reject) => {
        nodeFs.chmod(dest, mode, (e) => {
            if(e) {
                reject(e)
            }else{
                resolve()
            }
        })
    })
}
