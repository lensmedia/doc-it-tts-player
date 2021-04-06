export default interface TimingMetaInterface {
    // External from JSON data
    text: string,
    hash: string,
    start: number,
    end: number,

    // Internal tracking
    element?: HTMLElement,
    index?: number,
}
