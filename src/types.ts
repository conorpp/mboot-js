import {combine} from './util'

export enum CommandTag {
    FlashEraseAll = 0x01,
    FlashEraseRegion = 0x02,
    ReadMemory = 0x03,
    WriteMemory = 0x04,
    FillMemory = 0x05,
    FlashSecurityDisable = 0x06,
    GetProperty = 0x07,
    RecieveSbFile = 0x08,
    Execute = 0x09,
    Call = 0x0a,
    Reset = 0x0b,
    SetProperty = 0x0c,
    FlashEraseAllUnsecure = 0x0d,
    FlashProgramOnce = 0x0e,
    FlashReadOnce = 0x0f,
    FlashReadResource = 0x10,
    ConfigureMemory = 0x11,
    ReliableUpdate = 0x12,
    GenerateKeyBlob = 0x13,
    KeyProvisioning = 0x15,
}

export enum ResponseTag {
    Generic = 0xa0,
    ReadMemory = 0xa3,
    GetProperty = 0xa7,
    FlashReadOnce = 0xaf,
    FlashReadResource = 0xb0,
    KeyProvisioning = 0xb5,
}

export enum ErrorCode {
    Success = 0,
    Fail = 1,
    ReadOnly = 2,
    OutOfRange = 3,
    InvalidArgument = 4,
    Timeout = 5,
    NoTransferInProgress = 6,

    FlashSizeError = 100,
    FlashAlignmentError = 101,
    FlashAddressError = 102,
    FlashAccessError = 103,
    FlashProtectionViolation = 104,
    FlashCommandFailure = 105,
    FlashUnknownProperty = 106,
    FlashRegionExecuteOnly = 108,
    FlashExecInRamNotReady = 109,
    FlashCommandNotSupported = 111,
    FlashOutOfDateCFPAPage = 132,

    I2cTxUnderrun = 200,
    I2cRxOverrun = 201,
    I2cArbitrationLost = 202,

    SpiTxUnderrun = 300,
    SpiRxOverrun = 301,

    QspiFlashSizeError = 400,
    QspiFlashAlignmentError = 401,
    QspiFlashAddressError = 402,
    QspiFlashCommandError = 403,
    QspiFlashUnknownProperty = 404,
    QspiNotConfigured = 405,
    QspiCommandNotSupported = 406,
    QspiCommandTimeout = 407,
    QspiWriteFailure = 408,

    OtfadSecurityViolation = 500,
    OtfadLogicallyDisabled = 501,
    OtfadInvalidKey = 502,
    OtfadInvalidKeyBlob = 503,

    UnknownCommand = 10000,
    SecurityViolation = 10001,
    AbortDataPhase = 10002,
    PingError = 10003,
    NoResponse = 10004,
    NoResponseExpected = 10005,
    UnsupportedCommand = 10006,

    SbSectionOverrun = 10100,
    SbSignatureBad = 10101,
    SbSectionLength = 10102,
    SbUnencryptedOnly = 10103,
    Sb_EOF_Reached = 10104,
    SbChecksumBad = 10105,
    SbCrc32Bad = 10106,
    SbUnknownCommand = 10107,
    SbIdNotFound = 10108,
    SbDataUnderrun = 10109,
    SbJumpReturned = 10110,
    SbCallFailed = 10111,
    SbKeyNotFound = 10112,
    SbSecureOnly = 10113,
    SbResetReturned = 10114,
    SbRollbackBlocked = 10115,
    SbInvalidSectionMacCount = 10116,
    SbUnexpectedCommand = 10117,

    MemoryRangeInvalid = 10200,
    MemoryReadFailed = 10201,
    MemoryWriteFailed = 10202,
    MemoryCulmulativeWrite = 10203,
    MemoryNotConfigured = 10205,

    UnknownProperty = 10300,
    ReadOnlyProperty = 10301,
    InvalidPropertyValue = 10302,

    AppCrcPassed = 10400,
    AppCrcFailed = 10401,
    AppCrcInactive = 10402,
    AppCrcInvalid = 10403,
    AppCrcOutOfRange = 10404,

}

export enum Property {
    CurrentVersion = 0x01,
    AvailablePeripherals = 0x02,
    FlashStartAddress = 0x03,
    FlashSize = 0x04,
    FlashSectorSize= 0x05,
    FlashBlockCount= 0x06,
    AvailableCommands= 0x07,
    CrcCheckStatus= 0x08,
    LastError= 0x09,
    VerifyWrites= 0x0a,
    MaxPacketSize= 0x0b,
    ReservedRegions= 0x0c,
    ValidateRegions= 0x0d,
    RamStartAddress= 0x0e,
    RamSize= 0x0f,
    SystemDeviceId= 0x10,
    FlashSecurityState= 0x11,
    UniqueDeviceId= 0x12,
    FlashFacSupport= 0x13,
    FlashAccessSegmentSize= 0x14,
    FlashAccessSegmentCount= 0x15,
    FlashReadMargin= 0x16,
    QspiInitStatus= 0x17,
    TargetVersion= 0x18,
    ExternalMemoryAttributes= 0x19,
    ReliableUpdateStatus= 0x1a,
    FlashPageSize= 0x1b,
    IrqNotifierPin= 0x1c,
    PfrKeyStoreUpdateOpt= 0x1d,
}

export enum ReportId {
    CommandOut = 0x01,
    DataOut = 0x02,
    CommandIn = 0x03,
    DataIn = 0x04,
}

export enum KeyProvOperation {
    Enroll = 0,
    SetUserKey = 1,
    SetIntrinsicKey = 2,
    WriteNonVolatile = 3,
    ReadNonVolatile = 4,
    WriteKeyStore = 5,
    ReadKeyStore = 6,
}


export class Header {
    tag: number;
    flags: number;
    param_count: number;
    constructor(tag: number, flags: number, param_count: number) {
        this.tag = tag;
        this.flags = flags;
        this.param_count = param_count;
    }
    toBytes(): Uint8Array {
        return new Uint8Array([this.tag, this.flags, 0, this.param_count])
    }

    static fromBytes(bytes: Uint8Array): Header {
        return new Header(bytes[0], bytes[1], bytes[3])
    }
}

export class Params {
    params: number[];
    constructor(params: number[], bytes?: Uint8Array){
        this.params = params;
        if (bytes) {
            let p = Params.fromBytes(bytes);
            var self = this;
            p.params.forEach(param => {
                self.params.push(param)
            });
        }
    }

    toBytes (): Uint8Array {
        let buf = new Uint8Array(this.params.length * 4);
        let dataview = new DataView(buf.buffer);
        this.params.forEach((p,i) => {
            dataview.setUint32(i*4, p, true);
        });
        return buf;
    }
    static fromBytes (bytes: Uint8Array): Params {
        let dataview = new DataView(bytes.buffer);
        var params: number[] = new Array();
        for (var i = 0; i < bytes.length; i += 4) {
            // console.log(i + '/' + (bytes.length/4) + ' ' + bytes.length,dataview.getUint32(i, true) )
            params.push(dataview.getUint32(i, true));
        }
        return new Params(params)
    }
}

export class CommandPacket {
    header: Header;
    params: Params;
    constructor(header: Header, params: Params) {
        this.header = header;
        this.params = params;
    }

    static build(tag: number, flags: number, params?: number[]): CommandPacket {
        params = params || []
        return new CommandPacket( 
            new Header(tag, flags, params.length ),
            new Params(params),
        )
    }

    toBytes(): Uint8Array {
        return combine(this.header.toBytes(), this.params.toBytes())
    }
}

export class BaseResponse {
    header: Header;
    params: Params;
    constructor(header: Header, params: Params) {
        this.header = header;
        this.params = params;
    }

    get status():number {
        return this.params.params[0]
    }

    get success(): boolean {
        return this.status == ErrorCode.Success;
    }
    
    static fromBytes(bytes: Uint8Array): BaseResponse {
        let header = Header.fromBytes(bytes.slice(0,4))
        let params = Params.fromBytes(bytes.slice(4,))
        // console.log(bytes.slice(4,).buffer)
        // console.log(params)
        return new BaseResponse(header, params)
    }
    toBytes(): Uint8Array {
        return combine(this.header.toBytes(), this.params.toBytes())
    }
}

export class GenericResponse extends BaseResponse {
    static from(b: BaseResponse):GenericResponse { return new GenericResponse(b.header, b.params)}
    get commandTag(): number {
        return this.params.params[1]
    }
}

export class GetPropertyResponse extends BaseResponse {
    static from(b: BaseResponse):GetPropertyResponse { return new GetPropertyResponse(b.header, b.params)}
    get values(): number[] {
        return this.params.params.slice(1,);
    }
}

export class ReadMemoryResponse extends BaseResponse {
    static from(b: BaseResponse):ReadMemoryResponse{ return new ReadMemoryResponse(b.header, b.params)}
    get length(): number {
        return this.params.params[1]
    }
}

export class FlashReadOnceResponse extends BaseResponse {
    static from(b: BaseResponse):FlashReadOnceResponse{ return new FlashReadOnceResponse(b.header, b.params)}
    get data(): Uint8Array {
        return (new Params(this.params.params.slice(2, ))).toBytes()
    }
}
