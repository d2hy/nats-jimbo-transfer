/*
 * Copyright (c) 2015-present
 *
 * See the LICENSE file at the top-level directory of this distribution
 * for licensing information.
 *
 * Removal or modification of this copyright notice is prohibited.
 */

const { Writable } = require("stream");

const MAX_PAYLOAD = 1048576;
const END_MESSAGE = Buffer.from([]);

class NatsWritrable extends Writable {
    constructor(options, natsConnection, queueTopic) {
        if (!natsConnection) {
            throw new Error("Expected nats connection");
        }

        // set highWaterMark as Nats message size
        const optionsCopy = Object.assign({}, options);
        if (!optionsCopy.highWaterMark) {
            optionsCopy.highWaterMark = natsConnection.info ? natsConnection.info.max_payload
                : MAX_PAYLOAD;
        }

        super(optionsCopy);

        this.natsConnection = natsConnection;
        this.queueTopic = queueTopic;

        this.natsConnection.on("error", (err) => {
            // TODO
        });

        this.natsConnection.on("close", () => {
            // TODO
            this.natsConnection.publish(this.queueTopic, END_MESSAGE);
        });

        this.natsConnection.on("disconnect", () => {
            // TODO
            this.natsConnection.publish(this.queueTopic, END_MESSAGE);
        });
    }

    _write(chunk, encoding, callback) {
        // TODO check chunk
        this.natsConnection.publish(this.queueTopic, chunk);
        callback();
    }

    _final(callback) {
        // TODO
        this.natsConnection.publish(this.queueTopic, END_MESSAGE);
        callback();
    }
}

module.exports = NatsWritrable;
