import archiver from "archiver";
import * as fs from "fs";
import * as path from "path";
import {promisify} from "util";
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

interface IOptions {
    recursive: boolean;
    fromAge: Date;
    fileEvent: "birth" | "change" | "modify" | "access";
}

interface IFile {
    name: string;
    path: string;
}

const defaultOptions: IOptions = {
    fileEvent: "modify",
    // fromAge: new Date(),
    fromAge: new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000),
    recursive: false,
};

enum FileEvents {
    "birth" = "birthtimeMs",
    "change" = "ctimeMs",
    "modify" = "mtimeMs",
    "access" = "atimeMs",
}

export default class Archiver {
    private readonly dir: string;
    private options: IOptions;
    private files: IFile[] = [];

    constructor(dir: string = "./", options: Partial<IOptions> = {}) {
        this.dir = path.resolve(dir);
        this.options = {...defaultOptions, ...options};
        this.getFiles = this.getFiles.bind(this);
        this.readDir = this.readDir.bind(this);
        this.addToArchive = this.addToArchive.bind(this);
    }

    public async addToArchive(): Promise<string> {
        return new Promise(async (resolve, reject) => {
            console.log("STARTING TO ARCHIVE");
            const ts = new Date();
            const fileName = path.join(this.dir, `${ts.getFullYear()}-${ts.getMonth() + 1}-${ts.getDate()}-${ts.getHours()}-${ts.getMinutes()}-${ts.getSeconds()}-archive.zip`);
            const output = fs.createWriteStream(fileName);
            output.on("close", () => {
                console.log(archive.pointer() + " total bytes");
                console.log("archiver has been finalized and the output file descriptor has closed.");
                resolve(fileName);
            });
            const archive = archiver("zip", { zlib: {level: 9}});
            archive.pipe(output);
            this.files.forEach((file) => {
                archive.file(file.path, {name: file.path.replace(this.dir, "")});
            });
            await archive.finalize();
            console.log("ARCHIVE FINISHED");
            // return fileName;
        });
    }

    public async getFiles(): Promise<IFile[]> {
        console.info("STARTING TO READ DIRECTORY");
        const files = await this.readDir(this.dir);
        this.files = files;
        console.info("READ SUCCESSFUL");
        return files;
    }
    public async readDir(dir: string = this.dir): Promise<IFile[]> {
        const subDirs = await readdir(dir);
        const files = await Promise.all(subDirs.map(async (subdir) => {
            const res = path.resolve(dir, subdir);
            const fileStat = await stat(res);
            if (fileStat.isDirectory()) { return this.readDir(res); }
            return fileStat[FileEvents[this.options.fileEvent]] < this.options.fromAge.getTime() ?
                Promise.resolve({name: subdir, path: res}) :
                Promise.resolve(null);
        }));
        return files.reduce((a: IFile[], f) => f !== null ? a.concat(f) : a, []);
    }
}

// function readdir(dir: string): Promise<string[]> {
//     return new Promise<string[]>((resolve, reject) => {
//         fs.readdir(dir, (err, files) => {
//             if (err) { return reject(err); }
//             return resolve(files);
//         });
//     });
// }
//
// function stat(filePath: string): Promise<Stats> {
//     return new Promise<Stats>((resolve, reject) => {
//         fs.stat(filePath, (err, stats) => {
//             if (err) { return reject(err); }
//             return resolve(stats);
//         });
//     });
// }
