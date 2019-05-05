/*
 * Copyright (c) 2015-present
 *
 * See the LICENSE file at the top-level directory of this distribution
 * for licensing information.
 *
 * Removal or modification of this copyright notice is prohibited.
 */

const { Readable } = require("stream");

class SourceWrapper extends Readable {
    constructor(options, natsConnection, queueTopic) {
        super(options);

        this.natsConnection = natsConnection;
        this.queueTopic = queueTopic;

        this.natsConnection.on("close", () => {
            // TODO
            this.push(null);
        });

        this.natsConnection.on("disconnect", () => {
            // TODO
            this.push(null);
        });

        this.sourceBuff = [];

        this.mesageFunction = (msg) => {
            if (msg.length === 0) {
                this.sourceBuff.push(null);
                this.push(null);
            } else {
                this.sourceBuff.push(msg);
                this.push(this.sourceBuff.shift());
            }
        };

        this.natsConnection.subscribe(this.queueTopic, this.mesageFunction);
    }

    _read(size) {
        const data = this.sourceBuff.shift();

        if (data) {
            if (data.length === 0) {
                this.push(null);
            } else {
                this.push(data);
            }
        }
    }
}

module.exports = SourceWrapper;
