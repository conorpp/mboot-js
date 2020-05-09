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

export class Device {
    handle: any;
    product_name: string;
    locationId: string;
    serial_number: string;
    constructor(handle: any,  locationId: string, product_name: string, serial_number?: string){
        this.handle = handle;
        this.product_name = product_name;
        this.locationId = locationId;
        this.serial_number = serial_number || "";
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
    handle?: any;
    abstract async read(a?: number): Promise<HidReport>;
    abstract async write(report: HidReport): Promise<number>;
    // should be static method
    // abstract async enumerate(vid?: number, pid?: number): Promise<Device[]>;

    abstract async close(): Promise<any>;
}
