/*
 * Copyright (c) 2019-present
 *
 * See the LICENSE file at the top-level directory of this distribution
 * for licensing information.
 */

const { Readable } = require("stream");

/**
 * Generator of number sequence
 * @param {Number} start first number of sequence
 * @param {Number} end last number of sequence
 */
function* sequence(start, end) {
    for (let i = start; i < end; i += 1) {
        yield i;
    }
}

/**
 * Stream of numbers sequence
 * @param {number} start start sequence number. Default 1.
 * @param {number} end end sequence number. Default 10.
 * @return {Stream} redable stream of sequence number
 */
function streamNumbers(start = 1, end = 10) {
    const generator = sequence(start, end);
    return new Readable({
        encoding: "binary",
        read() {
            // eslint-disable-next-line no-restricted-syntax
            for (const value of generator) {
                this.push(value.toString());
            }
            this.push(null);
        }
    });
}

/**
 * Publish messages to NATS queue
 * @param {Stream} dataStream messages data stream
 * @param {Object} nats object of NATS
 * @param {String} queue NATS queue name
 */
function natsPublishPromise(dataStream, nats, queue) {
    return new Promise((resolve /* , reject */) => {
        dataStream.on("data", (chunk) => {
            nats.publish(queue, chunk);
        });
        dataStream.on("end", () => {
            nats.publish(queue, Buffer.from([]));
            resolve();
        });
    });
}

/**
 * Receive message from NATS publisher
 * @param {Object} nats object of NATS
 * @param {String} queue NATS queue name
 * @return {Promise} promise of full received message
 */
function natsSubscribePromise(nats, queue) {
    return new Promise((resolve /* , reject */) => {
        let message = "";
        nats.subscribe(queue, (msg) => {
            message += msg;
            if (!msg) {
                resolve(message);
            }
        });
    });
}

/**
 * Buffer readable stream
 * @param {Number} chunkCount count of buffers chunks
 * @param {Number} chunkSize buffer size
 * @return {Stream} readable stream
 */
function bufferReadableStream(chunkCount, chunkSize) {
    return new Readable({
        encoding: "binary",
        read() {
            for (let i = 0; i < chunkCount; i += 1) {
                this.push(Buffer.alloc(chunkSize, 1));
            }
            this.push(null);
        }
    });
}

module.exports = {
    streamNumbers,
    natsPublishPromise,
    natsSubscribePromise,
    bufferReadableStream
};
