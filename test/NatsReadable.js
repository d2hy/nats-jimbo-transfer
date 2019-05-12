/*
 * Copyright (c) 2019-present
 *
 * See the LICENSE file at the top-level directory of this distribution
 * for licensing information.
 */

const NATS = require("nats");
const chai = require("chai");
const { Writable } = require("stream");
const NatsReadable = require("../lib/NatsReadable");
const dataGeneration = require("./fixtures/dataGenerators");
const NatsWritable = require("../lib/NatsWritable");

const { expect } = chai;

const PORT = 4222;
const queue = "bigfile";

describe("NatsReadable", () => {
    let nats = null;
    let natsReadable = null;

    before(() => {
        nats = NATS.connect({
            port: PORT,
            preserveBuffers: true
        });
        natsReadable = new NatsReadable(nats, queue);
    });

    it("expect constructor generate exception", () => {
        // eslint-disable-next-line no-new
        const createNatsReadableWithoutParams = () => { new NatsReadable(); };
        // eslint-disable-next-line no-new
        const createNatsReadableOneParams = () => { new NatsReadable(nats); };

        expect(createNatsReadableWithoutParams).to.throw("Expected nats connection");
        expect(createNatsReadableOneParams).to.throw("Expected nats queue");
    });

    it("expect receive text data promise", async () => {
        // Arrange
        const dataStream = dataGeneration.streamNumbers();
        const natsPublishPromise = dataGeneration.natsPublishPromise(dataStream, nats, queue);

        // Act
        let result = "";
        // eslint-disable-next-line no-restricted-syntax
        for await (const chunk of natsReadable) {
            result += chunk;
        }
        await natsPublishPromise;

        // Arrange
        expect(result).to.be.equal("123456789");
    });

    it("expect receive some megabytes of data", async () => {
        // Arrange
        const mbCount = 6;
        const mbSize = 1024 * 1024;

        nats = NATS.connect({
            port: PORT,
            preserveBuffers: true
        });
        const natsConnectedPromise = new Promise((resolve) => {
            nats.on("connect", () => {
                resolve();
            });
        });
        await natsConnectedPromise;

        natsReadable = new NatsReadable(nats, queue);

        const dataStream = dataGeneration.bufferReadableStream(mbCount, mbSize);

        let dataCount = 0;
        const fsWriteStream = new Writable({
            write(chunk, encoding, callback) {
                dataCount += chunk.length;
                callback();
            }
        });

        const natsWritable = new NatsWritable(nats, queue);
        const writePipe = natsReadable.pipe(fsWriteStream);

        const writePromise = new Promise((resolve) => {
            writePipe.on("finish", () => {
                resolve();
            });
        });

        // Act
        dataStream.pipe(natsWritable);
        await writePromise;

        // Assert
        expect(dataCount).to.be.equal(mbSize * mbCount);
    });


    describe("unsubscribe nats connection", () => {
        it("expect unsubscribe after destroy readable stream", async () => {
            // Arrange
            const dataStream = dataGeneration.streamNumbers();
            const natsPublishPromise = dataGeneration.natsPublishPromise(dataStream, nats, queue);

            // eslint-disable-next-line no-unused-vars
            let result = "";
            // eslint-disable-next-line no-restricted-syntax
            for await (const chunk of natsReadable) {
                result += chunk;
            }
            await natsPublishPromise;

            // Act
            natsReadable.destroy();

            // Arrange
            expect(Object.keys(natsReadable.natsConnection.subs)).to.be.lengthOf(0);
        });

        it("expect unsubscribe after emit close readable stream", async () => {
            // Arrange
            const dataStream = dataGeneration.streamNumbers();
            const natsPublishPromise = dataGeneration.natsPublishPromise(dataStream, nats, queue);

            // eslint-disable-next-line no-unused-vars
            let result = "";
            // eslint-disable-next-line no-restricted-syntax
            for await (const chunk of natsReadable) {
                result += chunk;
            }
            await natsPublishPromise;

            // Act
            natsReadable.emit("close");

            // Arrange
            expect(Object.keys(natsReadable.natsConnection.subs)).to.be.lengthOf(0);
        });

        it("expect unsubscribe after emit error readable stream", async () => {
            // Arrange
            const dataStream = dataGeneration.streamNumbers();
            const natsPublishPromise = dataGeneration.natsPublishPromise(dataStream, nats, queue);

            // eslint-disable-next-line no-unused-vars
            let result = "";
            // eslint-disable-next-line no-restricted-syntax
            for await (const chunk of natsReadable) {
                result += chunk;
            }
            await natsPublishPromise;

            // Act
            natsReadable.emit("error");

            // Arrange
            expect(Object.keys(natsReadable.natsConnection.subs)).to.be.lengthOf(0);
        });
    });
});

describe("binary data test", () => {
    it("expect receive binary data, nats with preserveBuffers", async () => {
        // Arrange
        const nats = NATS.connect({
            port: PORT,
            preserveBuffers: true
        });
        const testDataBuffer = Buffer.from("\xc3\x28", "binary");

        const receiveDataPromise = new Promise((resolve) => {
            nats.subscribe("testDataBuffer", (msg) => {
                resolve(msg);
            });
        });

        // Act
        nats.publish("testDataBuffer", testDataBuffer);
        const result = await receiveDataPromise;

        // Assert
        expect(result).to.be.deep.equal(testDataBuffer);
    });

    it("expect receive binary data, nats without preserveBuffers", async () => {
        // Arrange
        const nats = NATS.connect({
            port: PORT,
            encoding: "binary"
        });
        const testDataBuffer = Buffer.from("\xc3\x28", "binary");

        const receiveDataPromise = new Promise((resolve) => {
            nats.subscribe("testDataBuffer", (msg) => {
                resolve(msg);
            });
        });

        // Act
        nats.publish("testDataBuffer", testDataBuffer);
        const result = await receiveDataPromise;

        // Assert
        expect(result).to.be.equal(testDataBuffer.toString("binary"));
    });
});
