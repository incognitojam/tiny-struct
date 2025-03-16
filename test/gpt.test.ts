import { readableStreamToArrayBuffer } from "bun";
import { expect, test, describe } from "bun:test";
import { XzReadableStream } from "xz-decompress";
import { struct, bytes, uint32, uint64 } from "../src";

describe("GPT Header", () => {
  const GPTHeader = struct("GPTHeader", {
    signature: bytes(8),
    revision: uint32(),
    headerSize: uint32(),
    crc32: uint32(),
    reserved: uint32(),
    currentLba: uint64(),
    backupLba: uint64(),
    firstUsableLba: uint64(),
    lastUsableLba: uint64(),
    diskGuid: bytes(16),
    partEntryStartLba: uint64(),
    numPartEntries: uint32(),
    partEntrySize: uint32(),
    crc32PartEntries: uint32(),
  }, {
    littleEndian: true,
  });

  test("basic GPT header operations", () => {
    expect(GPTHeader.size).toBe(92);

    const header = {
      signature: new TextEncoder().encode("EFI PART"),
      revision: 0x00010000,
      headerSize: 92,
      crc32: 0x12345678,
      reserved: 0,
      currentLba: 1n,
      backupLba: 1000000n,
      firstUsableLba: 34n,
      lastUsableLba: 999967n,
      diskGuid: new Uint8Array(16).fill(0xAA),
      partEntryStartLba: 2n,
      numPartEntries: 128,
      partEntrySize: 128,
      crc32PartEntries: 0x87654321,
    };
    const buffer = GPTHeader.to(header);
    expect(buffer.byteLength).toBe(92);

    // Parse back and check key values
    const parsed = GPTHeader.from(buffer);
    expect(new TextDecoder().decode(parsed.signature)).toBe("EFI PART");
    expect(parsed.revision).toBe(0x00010000);
    expect(parsed.currentLba).toBe(1n);
    expect(parsed.firstUsableLba).toBe(34n);
    expect(parsed.numPartEntries).toBe(128);

    // Check a value in the buffer directly
    const view = new DataView(buffer);
    expect(view.getUint32(8, true)).toBe(0x00010000); // revision
    expect(view.getBigUint64(24, true)).toBe(1n); // currentLba
  });

  test("external", async () => {
    const manifestUrl = "https://raw.githubusercontent.com/commaai/openpilot/refs/heads/master/system/hardware/tici/all-partitions.json";
    const manifest = await fetch(manifestUrl).then((res) => res.json());
    const gptImage = manifest.find((image: { name: string }) => image.name === "gpt_main_0");
    const compressedResponse = await fetch(gptImage.url);
    const buffer = await readableStreamToArrayBuffer(new XzReadableStream(compressedResponse.body!));
    const gpt = GPTHeader.from(buffer.slice(4096));
    expect(gpt).toMatchObject({
      signature: new TextEncoder().encode("EFI PART"),
      revision: 0x00010000,
      headerSize: 92,
      reserved: 0,
      currentLba: 1n,
      partEntryStartLba: 2n,
      numPartEntries: 32,
      partEntrySize: 128,
    });
  });
});
