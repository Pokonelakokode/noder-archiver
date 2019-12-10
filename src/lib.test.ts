import Archiver from "./lib";

// Test for the Archiver.
// Since the app kind of self testing, I only cover some major cases.

describe("Archiver", () => {
    it("should be able to retrieve files older then 30 days", async (done) => {
        const archiver = new Archiver();
        await archiver.getFiles();
        await archiver.addToArchive();
        expect(await archiver.checkArchive()).toBe(true);
        done();
    }, 100000);
    it("should be able to retrieve files from only the current folder", async (done) => {
        const archiver = new Archiver({recursive: false, fromAge: new Date()});
        await archiver.getFiles();
        await archiver.addToArchive();
        expect(await archiver.checkArchive()).toBe(true);
        done();
    }, 100000);
    // IF YOU RUN THIS TEST, IT WILL DELETE THE NODE_MODULES DIRECTORY.
    // IF YOU WANT TO RUN IT, DELETE .skip FROM THE LINE BELOW.
    it.skip("should be able to delete files after check", async (done) => {
        const archiver = new Archiver({DELETE: true});
        await archiver.getFiles();
        await archiver.addToArchive();
        expect(await archiver.checkArchive()).toBe(true);
        done();
    }, 100000);
});
