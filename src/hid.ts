// Hid wrapper
// ideally multiple backends can be supported (nodejs, webusb).

import debug from 'debug'
import { BaseResponse } from "./types";

var Log = debug('app:usb')

export class HidReport {
    data: Uint8Array;
    id: number;
    constructor (data: Uint8Array, id: number) {
        this.data = data;
        this.id = id;
    }
    static build(data: Uint8Array, id?: number): HidReport{
        id = id || 0;
        return new HidReport(data, id)
    }
}

export function encodeReport(report: HidReport, size: number): Uint8Array {
    var data_length = report.data.length < (size - 4) ? report.data.length : size - 4;
    var report_buf = new Uint8Array(size);
    report_buf[0] = report.id;
    report_buf[1] = 0;
    report_buf[2] = (data_length & 0xff) >> 0;
    report_buf[3] = (data_length & 0xff00) >> 8;
    report_buf.set(report.data.slice(0,data_length), 4);
    return report_buf;
}

export function decodeReport(data: Uint8Array): HidReport{
    let id = data[0]
    let length = data[2] | (data[3] << 8);

    data = data.slice(4,length + 4)
    return HidReport.build(data, id)
}
export abstract class Hid {
    abstract async read(a?: number): Promise<HidReport>;
    abstract async write(report: HidReport): Promise<number>;

    abstract close(): any;
}
