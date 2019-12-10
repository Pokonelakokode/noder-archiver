import Archiver, {IOptions} from "./lib";

// APP INIT - Setup Archiver options:
const defaultOptions: Partial<IOptions> = {
    dir: process.argv[2],
};
// Start APP with default options
startApp(defaultOptions);

async function startApp(options: Partial<IOptions>) {
    // Initialize the Archiver instance with options
    const arch = new Archiver(options);
    // Get files according to options
    await arch.getFiles();
    // Execute archivation and possible deletion of files
    await arch.addToArchive();
}
