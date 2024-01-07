import { argv } from "node:process";

import { decode } from "./bencoding";
import { readTorrentFile } from "./torrent";
import { stringifyBendecoded } from "./utils";
import { Tracker } from "./tracker";
import { Client } from "./client";
import { Peer } from "../peer";
import { PeerManager } from "./peer-manager";

const main = async () => {
  const command = argv[2];

  switch (command) {
    case "decode":
      console.log(JSON.stringify(stringifyBendecoded(decode(argv[3]))));
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

      const tracker = new Tracker(new Client("00112233445566778899"));
      const peers = await tracker.getPeers(
        torrent.announce,
        torrent.infoHash,
        torrent.length,
      );
      console.log(peers.join("\n"));

      break;
    }

    case "handshake": {
      const filename = argv[3];
      const torrent = await readTorrentFile(filename);

      const [ip, port] = (argv[4] as string).split(":");
      const peer = new Peer(ip, Number(port));

      const manager = new PeerManager(new Client("00112233445566778899"));
      const peerId = await manager.handshake(peer, torrent.infoHash);

      console.log(`Peer ID: ${peerId.toString("hex")}`);

      break;
    }

    default:
      throw new Error(`Unknown command ${command}`);
  }
};

(async () => {
  await main();
})();
