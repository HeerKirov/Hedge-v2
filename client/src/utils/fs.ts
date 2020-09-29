import nodeFs from "fs"

export async function writeFile<T>(file: string, data: T): Promise<T> {
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

export async function readFile<T>(file: string): Promise<T | null> {
    return new Promise(((resolve, reject) => {
        if(!nodeFs.existsSync(file)) {
            resolve(null)
        }
        nodeFs.readFile(file, {encoding: "utf8"}, (e, data) => {
            if(e) {
                reject(e)
            }else{
                resolve(JSON.parse(data) as T)
            }
        })
    }))
}

export function exists(path: string): boolean {
    return nodeFs.existsSync(path)
}

export async function mkdir(path: string): Promise<void> {
    if(nodeFs.existsSync(path)) {
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
    if(!nodeFs.existsSync(path)) {
        return
    }
    return new Promise(((resolve, reject) => {
        nodeFs.rmdir(path, {}, e => {
            if(e) {
                reject(e)
            }else{
                resolve()
            }
        })
    }))
}
