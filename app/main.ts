import { argv } from "node:process";

import { decode } from "./bencode";
import { readTorrentFile } from "./torrent";

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

const parsePeers = (peers: Buffer): string[] => {
  const result: string[] = [];

  let idx = 0;
  while (idx < peers.length) {
    const peer = peers.subarray(idx, idx + 6);

    const ip = Array.from({ length: 4 }, (_, idx) => peer.readUInt8(idx)).join(
      "."
    );

    const port = peer.readUInt16BE(4);
    result.push([ip, port].join(":"));

    idx += 6;
  }

  return result;
};

const main = async () => {
  const command = argv[2];

  switch (command) {
    case "decode":
      console.log(JSON.stringify(decode(argv[3])));
      break;

    case "info": {
      const filename = argv[3];

      const torrent = await readTorrentFile(filename);

      console.log(`Tracker URL: ${torrent.announce}
Length: ${torrent.length}
Info Hash: ${torrent.infoHash.toString("hex")}
Piece Length: ${torrent.pieceLength}
Piece Hashes:
${torrent.pieceHashes.map((hash) => hash.toString("hex")).join("\n")}`);

      break;
    }
    case "peers": {
      const filename = argv[3];

      const torrent = await readTorrentFile(filename);

      const url = new URL(torrent.announce);
      url.searchParams.set("peer_id", "00112233445566778899");
      url.searchParams.set("port", String(6881));
      url.searchParams.set("uploaded", String(0));
      url.searchParams.set("downloaded", String(0));
      url.searchParams.set("left", String(torrent.length));
      url.searchParams.set("compact", String(1));

      // safe bytes encoded, avoiding double encoding
      url.search += `&info_hash=${urlencodeBuffer(torrent.infoHash)}`;

      const response = await fetch(url);

      const { "failure reason": error, ...other } = decode(
        Buffer.from(await response.arrayBuffer())
      ) as any;

      if (error) {
        console.error("Error:", error.toString());
      } else if (other.peers) {
        console.log(parsePeers(other.peers).join("\n"));
      } else {
        console.log({ ...other });
      }

      break;
    }
    default:
      throw new Error(`Unknown command ${command}`);
  }
};

(async () => {
  await main();
})();
