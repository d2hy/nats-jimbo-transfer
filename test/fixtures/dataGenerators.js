/*
 * Copyright (c) 2015-present
 *
 * See the LICENSE file at the top-level directory of this distribution
 * for licensing information.
 *
 * Removal or modification of this copyright notice is prohibited.
 */

const { Readable } = require("stream");

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

module.exports = {
    streamNumbers,
    natsPublishPromise,
    natsSubscribePromise
};
