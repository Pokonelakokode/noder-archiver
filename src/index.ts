import {PathLike} from "fs";
import Archiver from "./lib";

const path: PathLike = process.argv[2];
startApp(path).then((message) => console.log(message));

async function startApp(dir: string) {
    const arch = new Archiver(dir);
    await arch.getFiles();
    await arch.addToArchive();
}
