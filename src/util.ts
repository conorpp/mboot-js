

export function combine(a: Uint8Array, b: Uint8Array): Uint8Array {
    var c = new Uint8Array(a.length + b.length);
    c.set(a);
    c.set(b, a.length);
    return c;
}

export function toHex(buf: Uint8Array) {
    var s = ''
    buf.forEach(num => {
        if (s.length) s += ' ';

        let hex = num.toString(16);
        if (hex.length == 1) hex = '0' + hex;

        s += hex;

    })
    return s;
}