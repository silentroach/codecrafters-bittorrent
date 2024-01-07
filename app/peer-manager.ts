import { createConnection } from "node:net";
import { Peer } from "../peer";
import { Client } from "./client";

const Protocol = "BitTorrent protocol";
// not bencode (no colon after length)
const ProtocolBuffer = Buffer.concat([
  Buffer.from([Protocol.length]),
  Buffer.from(Protocol),
]);

export class PeerManager {
  constructor(private readonly client: Client) {}

  private async getResponse(peer: Peer, data: Buffer): Promise<Buffer> {
    const socket = createConnection({ port: peer.port, host: peer.ip });

    return new Promise((resolve, reject) => {
      socket.on("connect", () => {
        socket.write(data);
        socket.end();
      });

      socket.once("error", (error) => {
        reject(error);
      });

      socket.on("data", (data) => {
        resolve(data);
      });
    });
  }

  public async handshake(peer: Peer, hash: Buffer): Promise<Buffer> {
    const handshake = Buffer.concat([
      ProtocolBuffer,
      Buffer.alloc(8, 0),
      hash,
      Buffer.from(this.client.id),
    ]);

    const response = await this.getResponse(peer, handshake);

    // @todo better parsing
    const protoLength = response.readUInt8(0);
    const peerId = response.subarray(protoLength + 29, protoLength + 49);

    return peerId;
  }
}
