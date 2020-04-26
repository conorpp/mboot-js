import {Hid} from './hid'
import { CommandPacket, BaseResponse, Property, CommandTag, GetPropertyResponse, ErrorCode } from './types';



function check_response(res: BaseResponse):boolean {
    if (res.success) {
        return true;
    } else {
        throw "Error: " + ErrorCode[res.status] + "(" + res.status + ")"
    }
}

export class Client {
    hid: Hid;
    constructor(hid : Hid) {
        this.hid = hid;
    }

    async sendRecv(cmd: CommandPacket): Promise<BaseResponse> {
        // console.log('writing');
        var total = 0;
        let data = cmd.toBytes()
        let toSend = data.length;
        while (total < toSend) {
            let sent = await this.hid.write(1, cmd.toBytes())
            data = data.slice(sent,)
            total += sent;
        }
        // console.log('wrote');
        let res = await this.hid.read()
        // console.log('read');
        let parsed_res = BaseResponse.fromBytes(res);
        check_response(parsed_res)
        return parsed_res
    }

    async buildSendRecv(tag: number, flags: number, params?: number[]): Promise<BaseResponse> {
        params = params || []
        var pkt = CommandPacket.build(tag, flags, params);
        var res = await this.sendRecv(pkt)
        return res
    }

    async getProperty(prop: Property, index?: number): Promise<number[]> {
        console.log('get property ',Property[prop])
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
        console.log('set property ',Property[prop])
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
    async flashEraseRegion(address: number, length:number, index?: number) {
        index = index || 0;
        return (await this.buildSendRecv(CommandTag.FlashEraseRegion, 0, [address, length, index])).status
    }

    async getMemories(): object {
        var memories = {'internal_flash': {}, 'internal_ram': {}}
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
}