/*
 * Copyright (c) 2019-present
 *
 * See the LICENSE file at the top-level directory of this distribution
 * for licensing information.
 */

/* eslint-disable no-console */
const NATS = require("nats");
const fs = require("fs");
const { NatsReadable, NatsWritable } = require("../index");

function main() {
    if (process.argv.length < 6) {
        console.error("Too less arguments");
        console.log("Usage:");
        console.log("node fileTrasfer.js <NATS port> <NATS queue name> <source file path> <destination file path>");
        process.exit(1);
    }

    // arguments parsing
    const natsPort = Number.parseInt(process.argv[2], 10);
    const natsQueue = process.argv[3];
    const sourceFileName = process.argv[4];
    const destinationFileName = process.argv[5];

    // nats connection
    const nats = NATS.connect({
        port: natsPort,
        preserveBuffers: true
    });

    // nats streams
    const natsWritable = new NatsWritable(nats, natsQueue);
    const natsReadable = new NatsReadable(nats, natsQueue);

    // file streams
    const fsReadStream = fs.createReadStream(sourceFileName);
    const fsWriteStream = fs.createWriteStream(destinationFileName);

    // streams pipes
    fsReadStream.pipe(natsWritable);
    const writePipe = natsReadable.pipe(fsWriteStream);

    writePipe.on("finish", () => {
        process.exit(0);
    });
}

main();
