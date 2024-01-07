import { decode } from "./bencoding";
import { Client } from "./client";

// @todo extract to separate file + write tests?
const isUrlSafe = (char: string) => /[a-zA-Z0-9\-\._~]/.test(char);
const urlencodeBuffer = (buf: Buffer): string => {
  let encoded = "";
  for (let i = 0; i < buf.length; i++) {
    const charBuf = Buffer.from("00", "hex");
    charBuf.writeUInt8(buf[i]);
    const char = charBuf.toString();
    // if the character is safe, then just print it, otherwise encode
    if (isUrlSafe(char)) {
      encoded += char;
    } else {
      encoded += `%${charBuf.toString("hex").toUpperCase()}`;
    }
  }
  return encoded;
};

// @todo extract to separate file maybe
const parsePeers = (peers: Buffer): string[] => {
  const result: string[] = [];

  let idx = 0;
  while (idx < peers.length) {
    const peer = peers.subarray(idx, idx + 6);

    const ip = Array.from({ length: 4 }, (_, idx) => peer.readUInt8(idx)).join(
      ".",
    );

    const port = peer.readUInt16BE(4);
    result.push([ip, port].join(":"));

    idx += 6;
  }

  return result;
};

export class Tracker {
  constructor(private readonly client: Client) {}

  public async getPeers(
    announce: string,
    hash: Buffer,
    /* temp */ length: number,
  ): Promise<string[]> {
    const url = new URL(announce);
    url.searchParams.set("peer_id", this.client.id);
    url.searchParams.set("port", String(this.client.port));
    url.searchParams.set("uploaded", String(0));
    url.searchParams.set("downloaded", String(0));
    url.searchParams.set("left", String(length));
    url.searchParams.set("compact", "1");

    // safe bytes encoded, avoiding double encoding
    url.search += `&info_hash=${urlencodeBuffer(hash)}`;

    const response = await fetch(url);
    if (response.status !== 200) {
      throw new Error(`Unexpected server response status ${response.status}`);
    }

    // @todo better code please

    const { "failure reason": error, ...other } = decode(
      Buffer.from(await response.arrayBuffer()),
    ) as Record<string, unknown>;

    if (error) {
      throw new Error(`Failed to get peers: ${error}`);
    }

    if (!Buffer.isBuffer(other.peers)) {
      throw new Error(`Failed to decode peers`);
    }

    return parsePeers(other.peers);
  }
}
