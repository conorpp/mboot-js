import {Hid} from './hid'
import { CommandPacket, BaseResponse, Property, CommandTag, GetPropertyResponse } from './types';

export class Client {
    hid: Hid;
    constructor(hid : Hid) {
        this.hid = hid;
    }

    async sendRecv(cmd: CommandPacket): Promise<BaseResponse> {
        // console.log('writing');
        await this.hid.write(1, cmd.toBytes())
        // console.log('wrote');
        var res = await this.hid.read()
        // console.log('read');
        return BaseResponse.fromBytes(res);
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
}