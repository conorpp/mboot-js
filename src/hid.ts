// Hid wrapper
// ideally multiple backends can be supported (nodejs, webusb).

import { HID } from "node-hid";
import { BaseResponse } from "./types";
import { toHex } from "./util";

// class Device {
//     path: string;
//     vid: number;
//     pid: number;
//     device: object;
//     constructor(path?: string, vid?: number, pid?: number, device?: object) {
//         this.path = path || ''
//         this.vid = vid || 0
//         this.pid = pid || 0
//         this.device = device || {}
//     }
// }

function encodeReport(id: number, size: number, data: Uint8Array): Uint8Array {
    var data_length = data.length < (size - 4) ? data.length : size - 4;
    var report_buf = new Uint8Array(size);
    report_buf[0] = id;
    report_buf[1] = 0;
    report_buf[2] = (data_length & 0xff) >> 0;
    report_buf[3] = (data_length & 0xff00) >> 8;
    report_buf.set(data, 4);
    return report_buf;
}

function decodeReport(data: Uint8Array): Uint8Array{
    let id = data[0]
    let length = data[2] | (data[3] << 8);

    data = data.slice(4,length + 4)
    return data
}
export abstract class Hid {

    abstract async read(a?: number): Promise<Uint8Array>;
    abstract async write(reportId: number, a: Uint8Array): Promise<number>;
}

export class NodeHid extends Hid {
    dev: HID;
    constructor(vid: number, pid: number) {
        super()
        this.dev = new HID(vid, pid);
    }
    async read(a?: number): Promise<Uint8Array> {
        let buf = new Uint8Array(this.dev.readSync())
        console.log('>>', toHex(buf));
        return decodeReport(buf);
    }

    async write(reportId: number, a: Uint8Array, ): Promise<number> {
        let buf = encodeReport(reportId, 64, a)
        console.log('<<', toHex(buf))

        return this.dev.write(
            Buffer.from(
                buf
            )
        );
            // this.dev.write(Buffer.from(a))
    }
}