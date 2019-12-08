import * as fs from "fs";
import {promisify} from "util";
import Archiver from "./lib";
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
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
        const archiver = new Archiver("./",{fromAge: daysBefore(110)});
        const files = await archiver.getFiles();
        const output = await archiver.addToArchive();
        await testZip(output);
        console.dir(files);
        expect(files.length).toBe(7207);
        done();
    }, 100000);
});

async function testZip(path: string) {
    const file = await readFile(path);
    const zip = await JSZip.loadAsync(file);
    zip.forEach((relativePath, file1) => {
        console.log(relativePath, file1);
    });
}
