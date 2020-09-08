import { TtsMetaTimingInterface } from './TtsMetaTimingInterface';

export interface TtsMetaInterface {
    file: string,
    segments: number,
    duration: number,
    timing: TtsMetaTimingInterface[],
}
