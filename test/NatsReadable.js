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
const fs = require("fs");
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
        natsReadable = new NatsReadable({}, nats, queue);
    });

    it("expect constructor generate exception");

    it("expect receive text data promise", async () => {
        // Arrange
        const dataStream = dataGeneration.streamNumbers();

        const sendFilePromise = dataGeneration.natsPublishPromise(dataStream, nats, queue);

        // Act
        let result = "";
        // eslint-disable-next-line no-restricted-syntax
        for await (const chunk of natsReadable) {
            result += chunk;
        }

        await sendFilePromise;

        // Arrange
        expect(result).to.be.equal("123456789");
    });

    it("expect receive big file data promise", async () => {
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

        natsReadable = new NatsReadable({}, nats, queue);

        // Arrange
        const dataStream = fs.createReadStream("/home/klmd/Загрузки/systemtap-4.0.tar.gz");
        const fsWriteStream = fs.createWriteStream("/home/klmd/tmp/systemtap-4.0_copy.tar.gz");

        const natsWritable = new NatsWritable({}, nats, queue);
        const writePipe = natsReadable.pipe(fsWriteStream);

        const writePromise = new Promise((resolve) => {
            writePipe.on("finish", () => {
                resolve();
            });
        });

        dataStream.pipe(natsWritable);

        await writePromise;
    });
});

describe("binary data test", () => {
    it("expect receive binary data, with preserveBuffers", async () => {
        const nats = NATS.connect({
            port: PORT,
            preserveBuffers: true
        });

        const invalid2octet = Buffer.from("\xc3\x28", "binary");

        const receiveDataPromise = new Promise((resolve) => {
            nats.subscribe("invalid2octet", (msg) => {
                resolve(msg);
            });
        });

        nats.publish("invalid2octet", invalid2octet);

        const result = await receiveDataPromise;

        expect(result).to.be.deep.equal(invalid2octet);
    });

    it("expect receive binary data, without preserveBuffers", async () => {
        const nats = NATS.connect({
            port: PORT,
            encoding: "binary"
        });

        const invalid2octet = Buffer.from("\xc3\x28", "binary");

        const receiveDataPromise = new Promise((resolve) => {
            nats.subscribe("invalid2octet", (msg) => {
                resolve(msg);
            });
        });

        nats.publish("invalid2octet", invalid2octet);

        const result = await receiveDataPromise;

        expect(result).to.be.equal(invalid2octet.toString("binary"));
    });
});
