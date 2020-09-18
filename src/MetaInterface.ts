import TimingMetaInterface from './TimingMetaInterface';

export default interface MetaInterface {
    file: string,
    segments: number,
    duration: number,
    timing: TimingMetaInterface[],
}
