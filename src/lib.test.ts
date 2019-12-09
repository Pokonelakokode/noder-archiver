import * as fs from "fs";
import {promisify} from "util";
import Archiver from "./lib";
const readFile = promisify(fs.readFile);
import JSZip from "jszip";

function daysBefore(days: number) {
    return new Date(new Date().getTime() - days * 24 * 60 * 60 * 1000);
}

describe("Archiver", () => {
    // beforeAll(async cb => {
    //     mock({
    //         'path/to/file.txt': 'file content here'
    //     });
    //     cb();
    //     // cb();
    // },10000);
    // afterAll(cb => {
    //     mock.restore();
    // });
    it("should be able to retrieve files older then 30 days", async (done) => {
        // fs.readdir('./',(err, files) => {
        //     console.dir(files)
        // })
        // const files = await readdir("./");

        // done();
        const archiver = new Archiver("./", {fromAge: daysBefore(30)});
        const files = await archiver.getFiles();
        const output = await archiver.addToArchive();
        // await testZip("f:/sites/node-archiver/2019-12-9-23-2-25-archive.zip");
        const testFileLength = await testZip(output);
        expect(files.length).toBe(testFileLength.length);
        done();
        // setTimeout(async () => {
        //     const testFileLength = await testZip(output);
        //     expect(files.length).toBe(testFileLength.length);
        //     done();
        // }, 2000);
        // console.dir(files);

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
