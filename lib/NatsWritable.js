/*
 * Copyright (c) 2019-present
 *
 * See the LICENSE file at the top-level directory of this distribution
 * for licensing information.
 */

const { Writable } = require("stream");

const MAX_PAYLOAD = 1048576;
const END_MESSAGE = Buffer.from([]);

class NatsWritable extends Writable {
    /**
     * NatsWritable constructor
     * @param {Object} natsConnection object of nats connection
     * @param {String} queueTopic nats queue name
     * @param {Object} options stream options. Default empty object
     */
    constructor(natsConnection, queueTopic, options = {}) {
        if (!natsConnection) {
            throw new Error("Expected nats connection");
        }

        if (!queueTopic) {
            throw new Error("Expected nats queue");
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

        this.natsConnection.on("close", () => {
            this.natsConnection.publish(this.queueTopic, END_MESSAGE);
        });

        this.natsConnection.on("disconnect", () => {
            this.natsConnection.publish(this.queueTopic, END_MESSAGE);
        });
    }

    _write(chunk, encoding, callback) {
        this.natsConnection.publish(this.queueTopic, chunk);
        callback();
    }

    _final(callback) {
        this.natsConnection.publish(this.queueTopic, END_MESSAGE);
        callback();
    }
}

module.exports = NatsWritable;
