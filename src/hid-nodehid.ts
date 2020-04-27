import debug from 'debug'

import {Hid, HidReport, encodeReport, decodeReport} from './hid'
import { toHex } from "./util";
import { HID } from "node-hid";

var Log = debug('app:usb')

export class NodeHid extends Hid {
    dev: HID;
    report_size: number;
    constructor(vid: number, pid: number, report_size: number) {
        super()
        this.dev = new HID(vid, pid);
        // cannot find the max report size using hidapi, so need
        // to supply it externally.
        this.report_size = report_size;
    }
    async read(a?: number): Promise<HidReport> {
        let buf = new Uint8Array(this.dev.readSync())
        Log('>>', toHex(buf));
        return decodeReport(buf);
    }

    async write( report: HidReport ): Promise<number> {
        let buf = encodeReport(report, this.report_size)

        Log('<<' + '('+ buf.length +')', toHex(buf));

        var count = this.dev.write(
            Buffer.from(
                buf
            )
        ) - 4;  // -4 for the report header

        return count;
    }

    close(): any {
        this.dev.close()
    }
}