/*
 * Copyright (c) 2019-present
 *
 * See the LICENSE file at the top-level directory of this distribution
 * for licensing information.
 */

const { Readable } = require("stream");

class NatsReadable extends Readable {
    /**
     * NatsReadable constructor
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

        super(options);

        this.natsConnection = natsConnection;
        this.queueTopic = queueTopic;

        this.natsConnection.on("close", () => {
            this.push(null);
        });

        this.natsConnection.on("disconnect", () => {
            this.push(null);
        });

        this.sourceBuff = [];

        this.mesageFunction = (msg) => {
            if (msg.length === 0) {
                this.sourceBuff.push(null);
                this.push(null);
            } else {
                this.sourceBuff.push(msg);
                if (this.readable) {
                    this.push(this.sourceBuff.shift());
                }
            }
        };

        this.natsConnection.subscribe(this.queueTopic, this.mesageFunction);
    }

    // eslint-disable-next-line no-unused-vars
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

module.exports = NatsReadable;
