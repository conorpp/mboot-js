import debug from 'debug'
import {Hid, HidReport} from './hid'
import { CommandPacket, BaseResponse, Property, 
    CommandTag, GetPropertyResponse, ErrorCode, 
    ReportId, GenericResponse, 
    ReadMemoryResponse} from './types';
import { combine } from './util';

var Log = debug('app:log')


function check_response(res: BaseResponse):boolean {
    if (res.success) {
        return true;
    } else {
        if (res.status == undefined)
            throw "Bootloader returned no parameters!"
        throw "Bootloader Error: " + ErrorCode[res.status] + "(" + res.status + ")"
    }
}

export class Client {
    hid: Hid;
    constructor(hid : Hid) {
        this.hid = hid;
    }

    async sendRecv(cmd: CommandPacket): Promise<BaseResponse> {

        await this.hid.write(HidReport.build(cmd.toBytes(), 1))

        let res = await this.hid.read()
        let parsed_res = BaseResponse.fromBytes(res.data);

        check_response(parsed_res)
        return parsed_res
    }

    async buildSendRecv(tag: number, flags: number, params?: number[]): Promise<BaseResponse> {
        params = params || []
        var pkt = CommandPacket.build(tag, flags, params);
        var res = await this.sendRecv(pkt)
        return res
    }

    async sendData(data: Uint8Array): Promise<boolean> {
        var status = ErrorCode.Fail;
        var total = 0;
        let toSend = data.length;
        while (total < toSend) {
            Log('writing ' + total + ' / ' + toSend);
            let sent = await this.hid.write(HidReport.build(data, 2))
            data = data.slice(sent,)
            total += sent;
        }
        let res = await this.hid.read()
        let parsed_res = BaseResponse.fromBytes(res.data);
        check_response(parsed_res)

        return parsed_res.success
    }

    async readData(tag: number, length: number): Promise<Uint8Array> {
        var data = new Uint8Array()
        var status = ErrorCode.Fail;
        while (true) {
            let res = await this.hid.read()

            if (res.id == ReportId.CommandIn) {
                let end = GenericResponse.from(BaseResponse.fromBytes(res.data))
                status = end.status
                if (end.commandTag == tag) {
                    break
                }
            } else {
                data = combine(data, res.data)
            }
        }
        if (data.length < length) {
            Log(data)
            throw 'Error: got less data than expected.'
        }
        return data
    }

    async getProperty(prop: Property, index?: number): Promise<number[]> {
        Log('get property ',Property[prop])
        index = index || 0;
        let pkt = CommandPacket.build(CommandTag.GetProperty, 0, [prop, index])
        let res = await this.sendRecv(pkt)

        if (res.success) {
            let a = GetPropertyResponse.from(res)
            return a.values
        } else {
            return []
        }
    }

    async setProperty(prop: Property, value: number): Promise<boolean> {
        Log('set property ',Property[prop])
        let pkt = CommandPacket.build(CommandTag.SetProperty, 0, [prop, value])
        let res = await this.sendRecv(pkt)
        return res.success
    }

    async reset(): Promise<boolean> {
        let pkt = CommandPacket.build(CommandTag.Reset, 0)
        let res = await this.sendRecv(pkt)

        if (res.success) {
            this.hid.close();
            return true
        }
 
        return false
    }

    async execute(address: number, argument: number, sp: number): Promise<boolean> {
        let pkt = CommandPacket.build(CommandTag.Execute, 0, [address, argument, sp])
        let res = await this.sendRecv(pkt)

        return res.success
    }

    async flashEraseAll(index?: number) {
        index = index || 0;
        return (await this.buildSendRecv(CommandTag.FlashEraseAll, 0, [index])).status
    }
    async flashEraseRegion(address: number, length:number, index?: number): Promise <boolean> {
        index = index || 0;
        return (await this.buildSendRecv(CommandTag.FlashEraseRegion, 0, [address, length, index])).success
    }

    async getMemories(): Promise<any> {
        var memories: any = {'internal_flash': {}, 'internal_ram': {}}
        var index = 0;
        var startAddress = 0;
        while (true) {
            let addresses = await this.getProperty(Property.FlashStartAddress, index)
            if (addresses.length == 0) break;
            if (index == 0) {
                startAddress = addresses[0];
            } else if (addresses[0] == startAddress) {
                break;
            }
            let internal = memories['internal_flash']
            internal[index] = {}
            internal[index]['address'] = addresses[0]
            
            let sizes = await this.getProperty(Property.FlashSize, index)
            if (sizes.length == 0) break;
            internal[index]['size'] = sizes[0]

            let sectors = await this.getProperty(Property.FlashSectorSize, index)
            if (sectors.length == 0) break;
            internal[index]['sector_size'] = sectors[0]

            index += 1;
        }

        index = 0;
        startAddress = 0;
        while (true) {
            let addresses = await this.getProperty(Property.RamStartAddress, index)
            if (addresses.length == 0) break;
            if (index == 0) {
                startAddress = addresses[0];
            } else if (addresses[0] == startAddress) {
                break;
            }
            let internal = memories['internal_ram']
            internal[index] = {}
            internal[index]['address'] = addresses[0]
            
            let sizes = await this.getProperty(Property.RamSize, index)
            if (sizes.length == 0) break;
            internal[index]['size'] = sizes[0]

            index += 1;
        }

        return memories
    }

    async readMemory (address: number, length: number, index?: number): Promise<Uint8Array> {
        index = index || 0;
        
        let res = await this.buildSendRecv(CommandTag.ReadMemory, 0, [address, length, index])

        let dataToRead = ReadMemoryResponse.from(res).length
        return this.readData(CommandTag.ReadMemory, dataToRead)
    }
    async writeMemory (address: number, data: Uint8Array, index?: number): Promise<boolean> {
        index = index || 0;
        let res = await this.buildSendRecv(CommandTag.WriteMemory, 0, [address, data.length, index])

        return this.sendData(data)
    }
}