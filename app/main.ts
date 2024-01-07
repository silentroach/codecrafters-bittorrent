import { argv } from "node:process";

import { decode } from "./bencoding";
import { readTorrentFile } from "./torrent";
import { stringifyBendecoded } from "./utils";
import { Tracker } from "./tracker";

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

      const tracker = new Tracker(torrent.announce, "00112233445566778899");
      const peers = await tracker.getPeers(torrent);

      console.log(peers.join("\n"));

      break;
    }
    default:
      throw new Error(`Unknown command ${command}`);
  }
};

(async () => {
  await main();
})();
