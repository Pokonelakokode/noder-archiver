import archiver from "archiver";
import * as fs from "fs";
import * as path from "path";
import {promisify} from "util";

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

interface IOptions {
    dir: string;
    recursive: boolean;
    format: archiver.Format;
    fromAge: Date;
    fileEvent: "birth" | "change" | "modify" | "access";
    archiverOptions: archiver.ArchiverOptions;
}

interface IFile {
    name: string;
    path: string;
}

const defaultOptions: IOptions = {
    archiverOptions: {zlib: {level: 9}},
    dir: "./",
    fileEvent: "modify",
    format: "zip",
    fromAge: new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000),
    recursive: true,
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

    constructor(options: Partial<IOptions> = {}) {
        this.options = {...defaultOptions, ...options};
        this.dir = path.resolve(this.options.dir);
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
                console.log("Archiver has been finalized and the output file descriptor has closed.");
                resolve(fileName);
            });
            const archive = archiver("zip", this.options.archiverOptions);
            archive.on("error", (error) => {
                console.log(error);
                reject(error);
            });
            archive.pipe(output);
            this.files.forEach((file) => {
                archive.file(file.path, {name: file.path.replace(this.dir, "")});
            });
            await archive.finalize();
            console.log("ARCHIVE FINISHED");
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
            if (fileStat.isDirectory()) {
                return this.options.recursive ?
                    this.readDir(res) :
                    Promise.resolve(null);
            }
            return fileStat[FileEvents[this.options.fileEvent]] < this.options.fromAge.getTime() ?
                Promise.resolve({name: subdir, path: res}) :
                Promise.resolve(null);
        }));
        return files.reduce((a: IFile[], f) => f !== null ? a.concat(f) : a, []);
    }
}
