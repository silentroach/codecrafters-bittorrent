import { promises as fs } from "node:fs";
import { createHash } from "node:crypto";
import { decode, encode } from "./bencode";

// @todo unsafe, better check?
interface TorrentData {
  announce: Buffer;
  info: {
    length: number;
    name: Buffer;
    "piece length": number;
    pieces: Buffer;
  };
}

export class Torrent {
  #data: TorrentData;

  constructor(data: TorrentData) {
    this.#data = data;
  }

  public get announce(): string {
    return this.#data.announce.toString();
  }

  public get length(): number {
    return this.#data.info.length;
  }

  public get infoHash(): Buffer {
    return createHash("sha-1").update(encode(this.#data.info)).end().digest();
  }

  public get pieceLength(): number {
    return this.#data.info["piece length"];
  }

  public get pieceHashes(): Buffer[] {
    const result: Buffer[] = [];
    const pieces = this.#data.info.pieces;

    let idx = 0;
    while (idx < pieces.length) {
      result.push(pieces.subarray(idx, idx + 20));
      idx += 20;
    }

    return result;
  }
}

export const readTorrentFile = async (filename: string): Promise<Torrent> => {
  const data = await fs.readFile(filename);
  return new Torrent(decode(data) as TorrentData /* @todo validate */);
};
