(function(global) {
    'use strict';

    // WebCrypto API polyfill for browser
    const crypto = window.crypto || window.msCrypto;
    const subtle = crypto.subtle || crypto.webkitSubtle;

    // Constants
    const HMAC_POS_DATA = 0x008;
    const HMAC_POS_TAG = 0x1B4;
    const NFC3D_AMIIBO_SIZE = 540;

    // MasterKeys class
    class MasterKeys {
        constructor(data, tag) {
            this.data = data;
            this.tag = tag;
        }
    }

    // MasterKey class
    class MasterKey {
        constructor(hmacKey, typeString, rfu, magicBytesSize, magicBytes, xorPad) {
            this.hmacKey = hmacKey;
            this.typeString = typeString;
            this.rfu = rfu;
            this.magicBytesSize = magicBytesSize;
            this.magicBytes = magicBytes;
            this.xorPad = xorPad;
        }
    }

    // DerivedKeys class
    class DerivedKeys {
        constructor() {
            // Initialize arrays to proper sizes for WebCrypto API
            this.aesKey = new Array(16).fill(0);  // 128 bits = 16 bytes
            this.aesIV = new Array(16).fill(0);   // 128 bits = 16 bytes
            this.hmacKey = new Array(32).fill(0); // 256 bits = 32 bytes
        }

        getByte(i) {
            if (i < 16) {
                return this.aesKey[i];
            } else if (i < 32) {
                return this.aesIV[i - 16];
            } else {
                return this.hmacKey[i - 32];
            }
        }

        setByte(i, val) {
            if (i < 16) {
                this.aesKey[i] = val;
                return;
            } else if (i < 32) {
                this.aesIV[i - 16] = val;
                return;
            } else {
                this.hmacKey[i - 32] = val;
                return;
            }
        }
    }

    // ArrayReader class
    class ArrayReader {
        constructor(buffer) {
            this.uint8 = new Uint8Array(buffer);
            this.int8 = new Int8Array(buffer);
        }

        readUInt8(index) {
            return this.uint8[index];
        }

        readInt8(index) {
            return this.int8[index];
        }
    }

    // Utility functions
    function memcmp(s1, s1Offset, s2, s2Offset, size) {
        for (let i = 0; i < size; i++) {
            if (s1[s1Offset + i] !== s2[s2Offset + i]) {
                return s1[s1Offset + i] - s2[s2Offset + i];
            }
        }
        return 0;
    }

    function memcpy(destination, destinationOffset, source, sourceOffset, length) {
        let setDestinationByte = Array.isArray(destination) ?
            (destination, i, value) => {
                destination[i] = value;
            } : (destination, i, value) => {
                destination.setByte(i, value);
            };
        let getSourceByte = Array.isArray(source) ?
            (source, i) => {
                return source[i];
            } : (source, i) => {
                return source.getByte(i);
            };

        for (let i = 0; i < length; i++) {
            setDestinationByte(destination, destinationOffset + i, getSourceByte(source, sourceOffset + i));
        }
    }

    function memccpy(destination, destinationOffset, source, sourceOffset, character, length) {
        for (let i = 0; i < length; i++) {
            destination[destinationOffset + i] = source[sourceOffset + i];
            if (source[sourceOffset + i] == character) {
                return destinationOffset + i + 1;
            }
        }
        return null;
    }

    function memset(destination, destinationOffset, data, length) {
        for (let i = 0; i < length; i++) {
            destination[destinationOffset + i] = data;
        }
    }

    // Key generation functions
    async function amiiboKeygen(masterKey, internalDump, derivedKeys) {
        let seed = [];
        amiiboCalcSeed(internalDump, seed);
        await keygen(masterKey, seed, derivedKeys);
    }

    function amiiboCalcSeed(internaldump, seed) {
        memcpy(seed, 0x00, internaldump, 0x029, 0x02);
        memset(seed, 0x02, 0x00, 0x0E);
        memcpy(seed, 0x10, internaldump, 0x1D4, 0x08);
        memcpy(seed, 0x18, internaldump, 0x1D4, 0x08);
        memcpy(seed, 0x20, internaldump, 0x1E8, 0x20);
    }

    async function keygen(baseKey, baseSeed, derivedKeys) {
        let preparedSeed = [];
        keygenPrepareSeed(baseKey, baseSeed, preparedSeed);
        await drbgGenerateBytes(baseKey.hmacKey, preparedSeed, derivedKeys);
    }

    function keygenPrepareSeed(baseKey, baseSeed, output) {
        // 1: Copy whole type string
        let outputOffset = memccpy(output, 0, baseKey.typeString, 0, 0, 14);

        // 2: Append (16 - magicBytesSize) from the input seed
        let leadingSeedBytes = 16 - baseKey.magicBytesSize;
        memcpy(output, outputOffset, baseSeed, 0, leadingSeedBytes);
        outputOffset += leadingSeedBytes;

        // 3: Append all bytes from magicBytes
        memcpy(output, outputOffset, baseKey.magicBytes, 0, baseKey.magicBytesSize);
        outputOffset += baseKey.magicBytesSize;

        // 4: Append bytes 0x10-0x1F from input seed
        memcpy(output, outputOffset, baseSeed, 0x10, 16);
        outputOffset += 16;

        // 5: Xor last bytes 0x20-0x3F of input seed with AES XOR pad and append them
        for (let i = 0; i < 32; i++) {
            output[outputOffset + i] = baseSeed[i + 32] ^ baseKey.xorPad[i];
        }
        outputOffset += 32;

        return outputOffset;
    }

    // Format conversion functions
    function tagToInternal(tag, internal) {
        memcpy(internal, 0x000, tag, 0x008, 0x008);
        memcpy(internal, 0x008, tag, 0x080, 0x020);
        memcpy(internal, 0x028, tag, 0x010, 0x024);
        memcpy(internal, 0x04C, tag, 0x0A0, 0x168);
        memcpy(internal, 0x1B4, tag, 0x034, 0x020);
        memcpy(internal, 0x1D4, tag, 0x000, 0x008);
        memcpy(internal, 0x1DC, tag, 0x054, 0x02C);
    }

    function internalToTag(internal, tag) {
        memcpy(tag, 0x008, internal, 0x000, 0x008);
        memcpy(tag, 0x080, internal, 0x008, 0x020);
        memcpy(tag, 0x010, internal, 0x028, 0x024);
        memcpy(tag, 0x0A0, internal, 0x04C, 0x168);
        memcpy(tag, 0x034, internal, 0x1B4, 0x020);
        memcpy(tag, 0x000, internal, 0x1D4, 0x008);
        memcpy(tag, 0x054, internal, 0x1DC, 0x02C);
    }

    // Async cryptographic functions for browser
    async function drbgGenerateBytes(hmacKey, seed, output) {
        const DRBG_OUTPUT_SIZE = 32;
        let outputSize = 48;
        let outputOffset = 0;
        let temp = [];

        let iterationCtx = { iteration: 0 };
        while (outputSize > 0) {
            if (outputSize < DRBG_OUTPUT_SIZE) {
                await drbgStep(hmacKey, iterationCtx.iteration, seed, temp, 0, iterationCtx);
                memcpy(output, outputOffset, temp, 0, outputSize);
                break;
            }

            await drbgStep(hmacKey, iterationCtx.iteration, seed, output, outputOffset, iterationCtx);
            outputOffset += DRBG_OUTPUT_SIZE;
            outputSize -= DRBG_OUTPUT_SIZE;
        }
    }

    async function drbgStep(hmacKey, iteration, seed, output, outputOffset, iterationCtx) {
        iterationCtx.iteration++;

        const keyData = new Uint8Array(hmacKey);
        const messageData = new Uint8Array([(iteration >> 8) & 0xff, (iteration >> 0) & 0xff].concat(seed));

        const key = await subtle.importKey(
            'raw',
            keyData,
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign']
        );

        const signature = await subtle.sign('HMAC', key, messageData);
        const buf = Array.from(new Uint8Array(signature));

        memcpy(output, outputOffset, buf, 0, buf.length);
    }

    async function computeHmac(hmacKey, input, inputOffset, inputLength, output, outputOffset) {
        const keyData = new Uint8Array(hmacKey);
        const messageData = new Uint8Array(input.slice(inputOffset, inputOffset + inputLength));

        const key = await subtle.importKey(
            'raw',
            keyData,
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign']
        );

        const signature = await subtle.sign('HMAC', key, messageData);
        const result = Array.from(new Uint8Array(signature));
        memcpy(output, outputOffset, result, 0, result.length);
    }

    async function amiiboCipher(keys, input, output) {
        // Ensure AES key is exactly 16 bytes for WebCrypto API
        let aesKeyBytes = new Uint8Array(16);
        for (let i = 0; i < 16; i++) {
            aesKeyBytes[i] = keys.aesKey[i] || 0;
        }

        // AES-128-CTR encryption
        const key = await subtle.importKey(
            'raw',
            aesKeyBytes,
            { name: 'AES-CTR' },
            false,
            ['encrypt', 'decrypt']
        );

        // Create counter block from IV (ensure exactly 16 bytes)
        const counter = new Uint8Array(16);
        for (let i = 0; i < 16; i++) {
            counter[i] = keys.aesIV[i] || 0;
        }

        const algorithm = {
            name: 'AES-CTR',
            counter: counter,
            length: 64  // Counter bits
        };

        const inputData = new Uint8Array(input.slice(0x02C, 0x02C + 0x188));
        const result = await subtle.encrypt(algorithm, key, inputData);
        const buf = Array.from(new Uint8Array(result));

        memcpy(output, 0x02C, buf, 0, 0x188);

        memcpy(output, 0, input, 0, 0x008);
        memcpy(output, 0x028, input, 0x028, 0x004);
        memcpy(output, 0x1D4, input, 0x1D4, 0x034);
    }

    // Main functions
    function loadMasterKeys(key) {
        let dataKey = readMasterKey(key, 0);
        let tagKey = readMasterKey(key, 80);

        if (dataKey.magicBytesSize > 16 || tagKey.magicBytesSize > 16) {
            return null;
        }

        return new MasterKeys(dataKey, tagKey);
    }

    function readMasterKey(buffer, offset) {
        let hmacKey = [];
        let typeString = [];
        let rfu;
        let magicBytesSize;
        let magicBytes = [];
        let xorPad = [];

        let reader = new ArrayReader(buffer);

        for (let i = 0; i < 16; i++)
            hmacKey[i] = reader.readUInt8(offset + i);
        for (let i = 0; i < 14; i++)
            typeString[i] = reader.readInt8(offset + i + 16);
        rfu = reader.readUInt8(offset + 16 + 14);
        magicBytesSize = reader.readUInt8(offset + 16 + 14 + 1);
        for (let i = 0; i < 16; i++)
            magicBytes[i] = reader.readUInt8(offset + i + 16 + 14 + 1 + 1);
        for (let i = 0; i < 32; i++)
            xorPad[i] = reader.readUInt8(offset + i + 16 + 14 + 1 + 1 + 16);

        return new MasterKey(hmacKey, typeString, rfu, magicBytesSize, magicBytes, xorPad);
    }

    async function unpack(amiiboKeys, tag) {
        let unpacked = new Array(NFC3D_AMIIBO_SIZE).fill(0);
        let result = false;
        let internal = new Array(NFC3D_AMIIBO_SIZE).fill(0);
        let dataKeys = new DerivedKeys();
        let tagKeys = new DerivedKeys();

        // Convert format
        tagToInternal(tag, internal);

        // Generate keys
        await amiiboKeygen(amiiboKeys.data, internal, dataKeys);
        await amiiboKeygen(amiiboKeys.tag, internal, tagKeys);

        // Decrypt
        await amiiboCipher(dataKeys, internal, unpacked);

        // Regenerate tag HMAC. Note: order matters, data HMAC depends on tag HMAC!
        await computeHmac(tagKeys.hmacKey, unpacked, 0x1D4, 0x34, unpacked, HMAC_POS_TAG);

        // Regenerate data HMAC
        await computeHmac(dataKeys.hmacKey, unpacked, 0x029, 0x1DF, unpacked, HMAC_POS_DATA);

        memcpy(unpacked, 0x208, tag, 0x208, 0x14);

        result = memcmp(unpacked, HMAC_POS_DATA, internal, HMAC_POS_DATA, 32) == 0 &&
            memcmp(unpacked, HMAC_POS_TAG, internal, HMAC_POS_TAG, 32) == 0;

        return {
            unpacked,
            result,
        };
    }

    async function pack(amiiboKeys, plain) {
        let packed = new Array(NFC3D_AMIIBO_SIZE).fill(0);
        let cipher = new Array(NFC3D_AMIIBO_SIZE).fill(0);
        let dataKeys = new DerivedKeys();
        let tagKeys = new DerivedKeys();

        // Generate keys
        await amiiboKeygen(amiiboKeys.tag, plain, tagKeys);
        await amiiboKeygen(amiiboKeys.data, plain, dataKeys);

        // Generated tag HMAC
        await computeHmac(tagKeys.hmacKey, plain, 0x1D4, 0x34, cipher, HMAC_POS_TAG);

        // Generate data HMAC
        let hmacBuffer = [].concat(
            plain.slice(0x029, 0x029 + 0x18B),
            cipher.slice(HMAC_POS_TAG, HMAC_POS_TAG + 0x20),
            plain.slice(0x1D4, 0x1D4 + 0x34)
        );
        await computeHmac(dataKeys.hmacKey, hmacBuffer, 0, hmacBuffer.length, cipher, HMAC_POS_DATA);

        // Encrypt
        await amiiboCipher(dataKeys, plain, cipher);

        // Convert back to hardware
        internalToTag(cipher, packed);

        memcpy(packed, 0x208, plain, 0x208, 0x14);

        return packed;
    }

    // PlainDataUtils functions
    const plainDataUtils = {
        getAmiiboId: function(plainData) {
            return plainData.slice(0x1DC, 0x1E3 + 1).map((a) => a.toString(16).padStart(2, '0')).join('');
        },

        getCharacterId: function(plainData) {
            return plainData.slice(0x1DC, 0x1DD + 1).map((a) => a.toString(16).padStart(2, '0')).join('');
        },

        getGameSeriesId: function(plainData) {
            return plainData.slice(0x1DC, 0x1DD + 1).map((a) => a.toString(16).padStart(2, '0')).join('').substr(0, 3);
        },

        getNickName: function(plainData) {
            let nameBuffer = plainData.slice(0x38, 0x4B + 1);
            for (let i = 0; i < nameBuffer.length; i += 2) {
                let tmp = nameBuffer[i];
                nameBuffer[i] = nameBuffer[i + 1];
                nameBuffer[i + 1] = tmp;
            }
            return decodeUtf16(new Uint16Array(new Uint8Array(nameBuffer).buffer));
        },

        getMiiName: function(plainData) {
            let nameBuffer = plainData.slice(0x66, 0x79 + 1);
            return decodeUtf16(new Uint16Array(new Uint8Array(nameBuffer).buffer));
        }
    };

    function decodeUtf16(w) {
        let i = 0;
        let len = w.length;
        let charCodes = [];
        while (i < len) {
            let w1 = w[i++];
            if (w1 === 0x0)
                break;
            if ((w1 & 0xF800) !== 0xD800) { // w1 < 0xD800 || w1 > 0xDFFF
                charCodes.push(w1);
                continue;
            }
            if ((w1 & 0xFC00) === 0xD800) { // w1 >= 0xD800 && w1 <= 0xDBFF
                throw new RangeError('Invalid octet 0x' + w1.toString(16) + ' at offset ' + (i - 1));
            }
            if (i === len) {
                throw new RangeError('Expected additional octet');
            }
            let w2 = w[i++];
            if ((w2 & 0xFC00) !== 0xDC00) { // w2 < 0xDC00 || w2 > 0xDFFF)
                throw new RangeError('Invalid octet 0x' + w2.toString(16) + ' at offset ' + (i - 1));
            }
            charCodes.push(((w1 & 0x3ff) << 10) + (w2 & 0x3ff) + 0x10000);
        }
        return String.fromCharCode.apply(String, charCodes);
    }

    // Export to global
    global.maboii = {
        loadMasterKeys: loadMasterKeys,
        pack: pack,
        unpack: unpack,
        plainDataUtils: plainDataUtils
    };

})(window);