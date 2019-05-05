# nats-jimbo-transfer
A [Node.JS](https://nodejs.org) module for transferring large files through the [NATS messaging system](https://nats.io).

## Installation

```bash
npm i https://github.com/d2hy/nats-jimbo-transfer
```

## Basic Usage

#### Example of write file data to nats queue
```javascript
    const NATS = require("nats");
    const fs = require("fs");
    const { NatsWritable } = require("nats-jimbo-transfer");

    const sourceFileName = "path to source file";
    const natsPort = 4222;

    // nats connection
    const nats = NATS.connect({
        port: natsPort,
        preserveBuffers: true
    });

    // nats streams
    const natsWritable = new NatsWritable(nats, natsQueue);

    // file streams
    const fsReadStream = fs.createReadStream(sourceFileName);

    // streams pipes
    fsReadStream.pipe(natsWritable);
```

#### Example of read file data from nats queue
```javascript
    const NATS = require("nats");
    const fs = require("fs");
    const { NatsReadable } = require("nats-jimbo-transfer");

    const destinationFileName = "path to desitnation file";
    const natsPort = 4222;

    // nats connection
    const nats = NATS.connect({
        port: natsPort,
        preserveBuffers: true
    });

    // nats streams
    const natsReadable = new NatsReadable(nats, natsQueue);

    // file streams
    const fsWriteStream = fs.createWriteStream(destinationFileName);

    // streams pipes
    const writePipe = natsReadable.pipe(fsWriteStream);
```

## About parameters
For create readable stream
```javascript
const natsReadable = new NatsReadable(nats, natsQueue, options);
```
For create writable stream
```javascript
    const natsWritable = new NatsWritable(nats, natsQueue, options);
```

Parameters:
 * nats - NATS connection
 * natsQueue - NATS queue name
 * options - stream options
