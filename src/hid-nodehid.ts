import debug from 'debug'

import {Hid, HidReport, encodeReport, decodeReport, Device} from './hid'
import { toHex } from "./util";
import { HID,devices } from "node-hid";

var Log = debug('app:usb')

export class NodeHid extends Hid {
    dev?: HID;
    path?: string;
    report_size: number;
    constructor(vid?: number, pid?: number, report_size?: number) {
        super()
        this.dev = undefined;
        this.report_size = 0;
        if (vid && pid)
            this.dev = new HID(vid, pid);
        // cannot find the max report size using hidapi, so need
        // to supply it externally.
        if (report_size)
            this.report_size = report_size;
    }
    static async openPath(path: any, report_size: number): Promise<NodeHid> {
        let nhid = new NodeHid();
        nhid.dev = new HID(path);
        nhid.report_size = report_size;
        nhid.handle = path;
        return nhid;
    }
    async read(a?: number): Promise<HidReport> {
        if (this.dev == undefined) throw 'Not connected';

        let buf = new Uint8Array(this.dev.readSync())
        Log('>>', toHex(buf));
        return decodeReport(buf);
    }

    async write( report: HidReport ): Promise<number> {
        if (this.dev == undefined) throw 'Not connected';

        let buf = encodeReport(report, this.report_size)

        Log('<<' + '('+ buf.length +')', toHex(buf));

        var count = this.dev.write(
            Buffer.from(
                buf
            )
        ) - 4;  // -4 for the report header

        return count;
    }

    static async enumerate(vid?: number, pid?: number): Promise<Device[]> {
        vid = vid || 0;
        pid = pid || 0;
        var devs = devices();
        var filtered = []

        for (var i = 0; i < devs.length ; i++) {
            if (vid && devs[i].vendorId != vid)
                continue;
            if (pid && devs[i].productId != pid)
                continue;
            filtered.push(
                new Device(
                    devs[i].path,
                    devs[i].path || '',
                    devs[i].product || '',
                    devs[i].serialNumber,
                )
            )
        }
        return filtered;
    }

    async close(): Promise<any> {
        if (this.dev == undefined) throw 'Not connected';
        this.dev.close()
    }
}