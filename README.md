# mboot-js

Access NXP bootloaders using Nodejs.

# Installing

```
npm i
```

# Running

Some examples.

List memories.

```
npm run dev -- list
```

Write binary firmware to flash.

```
npm run dev -- write 0 <firmware.bin>
```

Read it back.

```
npm run dev -- read 0 22532 # Assuming firmware.bin is 22532 bytes long
```

Reset/reboot.

```
npm run dev -- reset
```

# Acknowledgements / other projects

Thank you to [pyMBoot](https://github.com/molejar/pyMBoot) (by @molejar), which is a more capable tool based on Python.

