import archiver from "archiver";
import * as fs from "fs";
import JSZip from "jszip";
import * as path from "path";
import {promisify} from "util";
// Promisify version of fs methods
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const readFile = promisify(fs.readFile);
const unlink = promisify(fs.unlink);

// Archiver options interface
export interface IOptions {
    DELETE: boolean; /* You have to specify explicitly if you want to delete archived files */
    dir: string; /* The directory you want to check for files */
    recursive: boolean; /* Only the selected directory, or subdirectories too */
    format: archiver.Format; /* Output format of archive */
    fromAge: Date; /*The date from you want to archive files */
    fileEvent: "birth" | "change" | "modify" | "access"; /* The date event we are looking for */
    outDir: string; /* Output directory */
    outFile?: string; /* If not specified, the file name will be a timestamp + archive + extension.
    Only sets file name, you don't have to specify extension here*/
    archiverOptions: archiver.ArchiverOptions; /* This option is practically the node zlib library option */
}

// Basic file information
interface IFile {
    name: string;
    path: string;
}

// Default options
const defaultOptions: IOptions = {
    DELETE: false,
    archiverOptions: {zlib: {level: 9}},
    dir: "./",
    fileEvent: "modify",
    format: "zip",
    fromAge: new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000),
    outDir: "./dist",
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
    private fileName: string;

    constructor(options: Partial<IOptions> = {}) {
        this.options = {...defaultOptions, ...options}; /* Merge options with default options */
        this.dir = path.resolve(this.options.dir); /* Set directory */
        // Bind functions
        this.getFiles = this.getFiles.bind(this);
        this.readDir = this.readDir.bind(this);
        this.addToArchive = this.addToArchive.bind(this);
    }
    // Archive creation with check at the end, and possible file deletion.
    public async addToArchive(): Promise<string> {
        // Return Promise only when file closed, and checked.
        return new Promise(async (resolve, reject) => {
            console.log("STARTING TO ARCHIVE");
            const ts = new Date(); /* Create Timestamp */
            // Set the file name according to options.
            this.fileName = path.join(this.options.outDir, this.options.outFile || `${ts.getFullYear()}-${ts.getMonth() + 1}-${ts.getDate()}-${ts.getHours()}-${ts.getMinutes()}-${ts.getSeconds()}-archive.${this.options.format}`);
            const output = fs.createWriteStream(this.fileName); /* Create write stream */
            // Output close event.
            output.on("close", async () => {
                console.log(archive.pointer() + " total bytes");
                console.log("Archiver has been finalized and the output file descriptor has closed.");
                const valid = await this.checkArchive(); /* Archive check */
                if (valid) {
                    console.log("ARCHIVE CHECKED SUCCESSFULY");
                    // Delete files if DELETE option are set.
                    if (this.options.DELETE) {
                        await this.deleteFiles();
                    }
                    resolve(this.fileName);
                } else {
                    reject("ERROR IN FILE CHECK");
                }
            });
            const archive = archiver(this.options.format, this.options.archiverOptions); /* Create archiver instance */
            archive.on("error", (error) => {
                console.log(error);
                reject(error);
            });
            archive.pipe(output); /* Pipe archive output to write stream */
            // Add files to the archive
            this.files.forEach((file) => {
                archive.file(file.path, {name: file.path.replace(this.dir, "")});
            });
            await archive.finalize(); /* Finalize the archive */
            console.log("ARCHIVE FINISHED");
        });
    }

    public async checkArchive(): Promise<boolean> {
        // If no saved or collected files to archive, do nothing
        if (!this.fileName || !this.files) {
            return false;
        }
        const file = await readFile(this.fileName); /* Read the archive */
        const zip = await JSZip.loadAsync(file); /* Load zip*/
        const files: string[] = [];
        zip.forEach((relativePath, file1) => {
            files.push(relativePath); /* Collect all the file names from the zip */
        });
        return files.length === this.files.length; /* Compare the file record number with the original ones */
    }

    // Loads the files for archivation.
    public async getFiles(): Promise<IFile[]> {
        console.info("STARTING TO READ DIRECTORY");
        const files = await this.readDir(this.dir);
        this.files = files;
        console.info("READ SUCCESSFUL");
        return files;
    }

    // Directory reader
    public async readDir(dir: string = this.dir): Promise<IFile[]> {
        const subDirs = await readdir(dir); /* Read the directory */
        //  Map the file stats or directories to a Promise array.
        const files = await Promise.all(subDirs.map(async (subdir) => {
            const res = path.resolve(dir, subdir); /* Get path */
            const fileStat = await stat(res); /* Get file info */
            // If record is a directory
            if (fileStat.isDirectory()) {
                return this.options.recursive ? /* If options.recursive is true, load the sub directories too.*/
                    this.readDir(res) :
                    Promise.resolve(null);
            }
            return fileStat[FileEvents[this.options.fileEvent]] < this.options.fromAge.getTime() ? /* Compare dates */
                Promise.resolve({name: subdir, path: res}) : /* Return path and file name */
                Promise.resolve(null);
        }));
        return files.reduce((a: IFile[], f) => f !== null ? a.concat(f) : a, []); /* Filter out null values */
    }
    // Delete Files.
    private async deleteFiles(): Promise<boolean> {
        if (!this.fileName || !this.files) { /* If there is no saved or selected files, return false */
            return false;
        }
        // Delete all the files.
        Promise.all(this.files.map(async (value) => {
            return await unlink(value.path);
        }))
            .then(() => {
                console.log("DELETE SUCCESSFUL");
            });
    }
}
