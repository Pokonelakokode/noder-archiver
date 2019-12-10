# Node outdated file archiver

## Requirements

- Node 8+

## Install

- `npm run install` or `yarn run install`

## Build

Run `tsc` or `yarn run watch-ts`/`npm run watch-ts` for live compile in dev.

## Features

- Load files older then a specified date from a directory.
- Recursive load.
- Check archive after creation.
- Archived file clean up

## Options 
```
interface IOptions {
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
```

## Test

To run test, run `yarn run test` or `npm run test`.  
Since I cannot solve the file mocking yet, it will test against the app directory in default,  
which most likely find your node_modules folder.
To test deletion, you should erase the skip from the third test.
Note that it would erase your files, and you can't restore their original creation date.
