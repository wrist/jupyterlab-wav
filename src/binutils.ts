export function getUint32LE(raw: string, offset: number) {
  const dv = new DataView(new ArrayBuffer(4));
  dv.setUint8(0, raw.charCodeAt(offset+0));
  dv.setUint8(1, raw.charCodeAt(offset+1));
  dv.setUint8(2, raw.charCodeAt(offset+2));
  dv.setUint8(3, raw.charCodeAt(offset+3));
  return dv.getUint32(0, true); // Little endian
}

export function getInt32LE(raw: string, offset: number) {
  const dv = new DataView(new ArrayBuffer(4));
  dv.setUint8(0, raw.charCodeAt(offset+0));
  dv.setUint8(1, raw.charCodeAt(offset+1));
  dv.setUint8(2, raw.charCodeAt(offset+2));
  dv.setUint8(3, raw.charCodeAt(offset+3));
  return dv.getInt32(0, true); // Little endian
}

export function getInt16LE(raw: string, offset: number) {
  const dv = new DataView(new ArrayBuffer(2));
  dv.setUint8(0, raw.charCodeAt(offset+0));
  dv.setUint8(1, raw.charCodeAt(offset+1));
  return dv.getInt16(0, true); // Little endian
}

export function getDumpText(raw: string, maxcol: number) {
  let dump_text = '';

  dump_text += '       |  0  1  2  3  4  5  6  7  8  9  A  B  C  D  E  F';
  dump_text += '  | ASCII TEXT\n';
  dump_text += '-------+------------------------------------------------';
  dump_text += '--+-----------------\n';
  for (let i=0; i<maxcol; i++) {
    const target = raw.slice(i*16, (i+1)*16);
    let hex_text: string = '';
    let chr_text: string = '';
    for (const v of target) {
      const val = v.charCodeAt(0);
      const hex2digit = ('0' + val.toString(16)).substring(0, 2);
      hex_text += hex2digit + ' ';
      chr_text += (val < 0x20 || 0x7e < val) ? '.' : v;
    }
    // console.log(hex_text + " | " + chr_text);
    dump_text += '0x' + ('0' + i.toString(16)).substring(0, 2) + '__';
    dump_text += ' | ' + hex_text + ' | ' + chr_text + '\n';
  }
  return dump_text;
}
