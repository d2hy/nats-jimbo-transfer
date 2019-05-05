/*
 * Copyright (c) 2015-present
 *
 * See the LICENSE file at the top-level directory of this distribution
 * for licensing information.
 *
 * Removal or modification of this copyright notice is prohibited.
 */

const NATS = require("nats");
const chai = require("chai");
const dataGeneration = require("./fixtures/dataGenerators");

const NatsWritable = require("../lib/NatsWritable");

const { expect } = chai;

const PORT = 4222;
const queue = "bigfile";

describe("NatsWritable", () => {
    let nats = null;
    let natsWritable = null;

    before(() => {
        nats = NATS.connect({
            port: PORT
        });
        natsWritable = new NatsWritable({}, nats, queue);
    });

    it("expect constructor generate exception");

    it("expect send big file promise", async () => {
        // Arrange
        const dataStream = dataGeneration.streamNumbers();
        const subscribePromise = dataGeneration.natsSubscribePromise(nats, queue);

        // Act
        const sendFilePromise = new Promise((resolve /* , reject */) => {
            dataStream.pipe(natsWritable);

            resolve();
        });
        await sendFilePromise;

        const result = await subscribePromise;

        // Assert
        expect(result).to.be.exist;
        expect(result).to.be.equal("123456789");
    });
});
