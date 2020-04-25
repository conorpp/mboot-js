
import {NodeHid} from './hid'
import {Client} from './client'
import yargs = require('yargs')
import { Property } from './types';
const argv = yargs.options({
    pid: { type: 'number', alias: 'p' },
    vid: { type: 'number', alias: 'v' },
  }).argv;


function open_device(vid: number, pid: number) {

    var devices = HID.devices();
    for (var i = 0; i < devices.length; i++){
        var dev = devices[i];
        // console.log(dev)
        if (dev.vendorId == argv.vid && dev.productId == argv.pid) {
            dev = new HID.HID(dev.path)
            return dev
        }
    }
    throw 'Could not find device'
}
// console.log(devices);

console.log(argv.vid)
console.log(argv.pid)

var dev = new NodeHid(argv.vid, argv.pid)

var client = new Client(dev)

async function run () {

    var prop = await client.getProperty(Property.CurrentVersion)
    console.log('prop',prop)

}
run()
