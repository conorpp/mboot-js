
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

        // var sector_size = (await client.getProperty(Property.FlashSectorSize))[0]
        // var erase_size = Math.ceil(contents.length/sector_size) * sector_size;
	var erase_size = contents.length;
        console.log('Erasing '+erase_size+ ' bytes')
        await client.flashEraseRegion(parseInt(address), erase_size)
        console.log('Writing ' + contents.length + ' bytes')
        await client.writeMemory(parseInt(address), contents)

        console.log(contents.length + ' bytes written.')
    });

program
    .command('write-words <address> [words...]')
    .description('Write words to address.')
    .action(async (address: string, words: string[]) => {
        let client = await getClient()

        let parsed_words: number[] = [];
        for (let i = 0; i < words.length; i++) {
            parsed_words.push(parseInt(words[i]));
        }

        await client.write_words(parseInt(address), Uint32Array.from(parsed_words), 0);

        console.log('Wrote words');
    });

program
    .command('configure <mem-id> <address>')
    .description('Run configure memory command.')
    .action(async (mem_id: string, address: string) => {
        let client = await getClient()

        await client.configure_memory(parseInt(address), parseInt(mem_id));

        console.log('Configured mem');
    });

program
    .command('set-key <key-type> <key-hex>')
    .description('Write a known key to the device.')
    .action(async (key_type: string, key_data: string) => {
        let client = await getClient()

        let data = Uint8Array.from(Buffer.from(key_data, 'hex'));
        let r = await client.setUserKey(parseInt(key_type), data);

        console.log('Wrote key', r);
    });

program
    .command('gen-key <key-type> <key-length>')
    .description('Generate a key on the device.')
    .action(async (key_type: string, key_length: string) => {
        let client = await getClient()

        await client.generateDeviceKey(parseInt(key_type), parseInt(key_length));

        console.log('generated key');
    });

program
    .command('enroll')
    .description('Enroll the PUF.')
    .action(async () => {
        let client = await getClient()

        await client.enroll();

        console.log('Enrolled PUF');
    });

program
    .command('write-nvm <mem-id>')
    .description('Write the keystore to nvm memory.')
    .action(async (mem_id:string) => {
        let client = await getClient()

        await client.write_keys_non_volatile(parseInt(mem_id));

        console.log('Wrote keystore');
    });

program
    .command('read-key-store <file.bin>')
    .description('Read keystore to file.')
    .action(async (filename:string) => {
        let client = await getClient()

        let memory = await client.read_keystore(0);
        fs.writeFileSync(filename, memory, {flag: 'w+'});

        console.log('read keystore to ' + filename);
    });

program
    .command('receive-sb <file.sb2>')
    .description('Write sb2 file to device.')
    .action(async (filename:string) => {
        let client = await getClient()

        let contents = fs.readFileSync(filename);

        await client.receive_sb(Uint8Array.from(contents));

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
    .command('erase <address> <length>')
    .description('Erase flash.  Address and length should be block size aligned.')
    .action(async (address: string, length: string) => {
        let client = await getClient()

        await client.flashEraseRegion(parseInt(address), parseInt(length))

        console.log(length +' bytes erased.')
    });

program
    .command('raw-write <address> <hex-data>')
    .description('Write flash without erasing first.')
    .action(async (address: string, data: string) => {
        let client = await getClient()

        await client.writeMemory(parseInt(address), Uint8Array.from(Buffer.from(data,'hex')))

        console.log(data.length/2 +' bytes erased.')
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

program.on('option:verbose', function () {
    debug.enable('app:*')
});

program.parse(process.argv)

function getClient() {
    try {
        var dev = new NodeHid(program.vid, program.pid, 60)
        var client = new Client(dev)
        return client;
    } catch(e) {
        var dev = new NodeHid(0x1209, 0xb000, 60)
        var client = new Client(dev)
        return client;

    }
}


