
import fs from 'fs'
import debug from 'debug'
import {NodeHid} from './hid-nodehid'
import {Client} from './client'
const { program } = require('commander');
import { Property } from './types';
import { toHex } from './util';

program.version('0.0.1')
    .option('-v, --vid <vid>', 'USB Vendor ID', '0x1fc9')
    .option('-p, --pid <pid>', 'USB Product ID', '0x21')
    .option('-V, --verbose', 'Output logs')
    .option('-r, --report-size [size]', 'Set the HID report size (default 60)');

program
    .command('list')
    .description('List devices.')
    .action(async () => {
        let devices = await Client.enumerate(
            async () => {
                return await NodeHid.enumerate(0x1fc9, 0x21)
            },
            async (handle?: any) => {
                return await NodeHid.openPath(handle, 60);
            }
        )
        console.log(devices);
    });

program
    .command('mlist')
    .description('List memories on device.')
    .action(async () => {
        let memories = await getClient().getMemories()
        console.log(memories)
    });

program
    .command('read <address> <length>')
    .description('Read memory on the device.')
    .option('-o, --output <output-file>', "Write read data to output file")
    .action(async (address: string, length: string, options: any) => {
        let memory = await getClient().readMemory(
            parseInt(address), parseInt(length)
        )
        if (options.output){
            fs.writeFileSync(options.output, memory, {flag: 'w+'});
            console.log('Read ' + memory.length+ ' bytes.')
        } else {
            console.log('0x' + parseInt(address).toString(16) + ':')
            console.log(toHex(memory))
        }
    });

program
    .command('write <address> <file>')
    .description('Write binary data to address.')
    .action(async (address: string, file: string) => {
        let contents = fs.readFileSync(file, {flag: 'r'})
        let client = await getClient()

        var sector_size = (await client.getProperty(Property.FlashSectorSize))[0]
        var erase_size = Math.ceil(contents.length/sector_size) * sector_size;
        console.log('Erasing '+erase_size+ ' bytes')
        await client.flashEraseRegion(parseInt(address), erase_size)
        console.log('Writing ' + contents.length + ' bytes')
        await client.writeMemory(parseInt(address), contents)

        console.log(contents.length + ' bytes written.')
    });

program
    .command('eraseSector <address> <length>')
    .description('Erase flash.  Address and length should be block size aligned.')
    .action(async (address: string, length: string) => {
        let client = await getClient()

        var sector_size = (await client.getProperty(Property.FlashSectorSize))[0]
        var erase_size = Math.ceil(parseInt(length)/sector_size) * sector_size;

        if (erase_size != parseInt(length)) {
            console.log('Warning, aligning '+length+" to " + erase_size);
        }

        await client.flashEraseRegion(parseInt(address), erase_size)

        console.log(erase_size+' bytes erased.')
    });

program
    .command('massErase')
    .description('Erase entire flash. ')
    .action(async () => {
        let client = await getClient().flashEraseAll()
        console.log('Flash erased.');
    });

program
    .command('reset')
    .description('Perform a device soft reboot/reset.')
    .action(async () => {
        let client = await getClient().reset()
        console.log('Device reset.');
    });

program.parse(process.argv)
if (program.verbose) {
    debug.enable('app:*')
}
// console.log(program)

function getClient() {
    var dev = new NodeHid(program.vid, program.pid, 60)
    var client = new Client(dev)
    return client;
}


