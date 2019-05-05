/*
 * Copyright (c) 2015-present
 *
 * See the LICENSE file at the top-level directory of this distribution
 * for licensing information.
 *
 * Removal or modification of this copyright notice is prohibited.
 */

const NATS = require("nats");
const fs = require("fs");
const { NatsReadable, NatsWritable } = require("../index");

function main() {
    const natsPort = Number.parseInt(process.argv[2], 10);
    const natsQueue = process.argv[3];
    const sourceFileName = process.argv[4];
    const destinationFileName = process.argv[5];

    const nats = NATS.connect({
        port: natsPort,
        preserveBuffers: true
    });

    const natsWritable = new NatsWritable({ }, nats, natsQueue);
    const natsReadable = new NatsReadable({}, nats, natsQueue);

    const fsReadStream = fs.createReadStream(sourceFileName);
    const fsWriteStream = fs.createWriteStream(destinationFileName);

    fsReadStream.pipe(natsWritable);
    const writePipe = natsReadable.pipe(fsWriteStream);

    writePipe.on("finish", () => {
        process.exit(0);
    });
}

main();
