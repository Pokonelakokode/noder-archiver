import * as fs from "fs";
import {promisify} from "util";
import Archiver from "./lib";
const readFile = promisify(fs.readFile);
import JSZip from "jszip";

function daysBefore(days: number) {
    return new Date(new Date().getTime() - days * 24 * 60 * 60 * 1000);
}

describe("Archiver", () => {
    it("should be able to retrieve files older then 30 days", async (done) => {
        const archiver = new Archiver();
        const files = await archiver.getFiles();
        const output = await archiver.addToArchive();
        const testFileLength = await testZip(output);
        expect(files.length).toBe(testFileLength.length);
        done();
    }, 100000);
    it("should be able to retrieve files from only the current folder", async (done) => {
        const archiver = new Archiver({recursive: false, fromAge: new Date()});
        const files = await archiver.getFiles();
        const output = await archiver.addToArchive();
        const testFileLength = await testZip(output);
        expect(files.length).toBe(testFileLength.length);
        done();
    }, 100000);

});

async function testZip(path: string): Promise<string[]> {
    const file = await readFile(path);
    const zip = await JSZip.loadAsync(file);
    const files: string[] = [];
    zip.forEach((relativePath, file1) => {
        files.push(relativePath);
    });
    return files;
}
