import TtsOptionsInterface from './TtsOptionsInterface';

import Player from './Player';
import Storage from './Storage';
import MetaInterface from './MetaInterface';
import TimingMetaInterface from './TimingMetaInterface';

import CssSelector from './Type/CssSelector';

import { selectorArgToElement } from './Utils';

export default class Tts {
    private readonly options: TtsOptionsInterface = {
        content: '#tts-content',
        player: {
            element: '#tts-player',
        },
        classes: {
            playable: 'tts-playable',
            active: 'tts-active',
        },
        document: '',
        tts: 'meta.json',
        ignore: [],
        scrollToActiveLine: true,
        enableClickableLines: true,
        // doubleClickDuration: 0,
    };

    private player: Player;
    private content: HTMLElement;

    public storage = new Storage('tts-');

    public tts: MetaInterface;

    public get timing() {
        return this.tts && this.tts.timing;
    }

    public audio: HTMLAudioElement;
    public activeTtsItem: TimingMetaInterface;

    private ignore: string;

    constructor(options: TtsOptionsInterface) {
        this.options = Object.assign(this.options, options);

        this.player = new Player(this, this.options.player);
    }

    public async initialize() {
        this.content = this.initializeContentContainer(this.options.content);
        this.updateIgnoreSelectors(this.options.ignore);

        this.audio = this.initializeAudio();
        await this.loadMetaData(this.options.document + '/' + this.options.tts);

        this.player.initializeAudioElement(this.audio);
    }

    private async loadMetaData(file) {
        const response = await fetch(file);
        const json = await response.json();

        this.tts = json.tts;
        this.audio.src = this.options.document + '/' + this.tts.file;

        for (let i = 0; i < this.timing.length; i++) {
            const timing = this.timing[i];
            const selector = `[data-tts="${timing.hash}"]:not([data-tts-index])`;
            const el = document.querySelector<HTMLElement>(selector);

            if (!el) {
                throw new Error('Timing list and document content do not match.');
            }

            timing.index = i;
            timing.element = el;

            el.dataset.ttsIndex = i.toString();
        }
    }

    private initializeContentContainer(content: CssSelector): HTMLElement {
        content = selectorArgToElement(content);
        if (content instanceof HTMLElement) {
            content.classList.add('tts-content');

            return content;
        }
    }

    private initializeAudio(source?: string): HTMLAudioElement {
        this.audio = new Audio(source);

        this.audio.volume = this.storage.get('volume', 1);
        this.audio.addEventListener('volumechange', this.onVolumeChange.bind(this));

        this.audio.addEventListener('timeupdate', this.onTimeUpdate.bind(this));
        this.audio.addEventListener('error', this.onError.bind(this));
        this.audio.addEventListener('ended', this.onEnded.bind(this));

        this.audio.addEventListener('loadedmetadata', this.onLoadedMetaData.bind(this));

        return this.audio;
    }

    private onLoadedMetaData(event) {
        const callback = this.options?.events?.onLoadedMetaData;
        if (callback && typeof(callback) === 'function') {
            callback(event, this);
        }

        this.bindClickableLines();
    }

    /**
     * Add click listener to all lines so we can use a click to start
     * playing from that specific line.
     */
    private bindClickableLines() {
        if (!this.options.enableClickableLines) {
            const elements = this.content.getElementsByClassName(this.options.classes.playable);
            for (let i = 0; i < elements.length; i++) {
                elements[i].classList.remove(this.options.classes.playable);
            }

            return;
        }

        const elements = this.content.querySelectorAll<HTMLElement>('[data-tts]');
        for (let i = 0; i < elements.length; i++) {
            const element: HTMLElement = elements[i];
            element.classList.remove(this.options.classes.playable);

            if (this.ignore && element.matches(this.ignore)) {
                continue;
            }

            element.classList.add(this.options.classes.playable);
            element.addEventListener('click', this.onTtsItemClick.bind(this));

            // Stop link clicks from also playing the line.
            const links = element.querySelectorAll<HTMLAnchorElement>('a[href]');
            for (let j = 0; j < links.length; j++) {
                links[j].addEventListener('click', e => e.stopPropagation());
            }
        }
    }

    public updateIgnoreSelectors(selectors: string[] | undefined): void {
        if (!selectors || !selectors.length) {
            this.ignore = undefined;
            return;
        }

        let ignore = [];
        for (let i = 0; i < selectors.length; i++) {
            const selector = selectors[i];
            ignore.push(selector + '[data-tts]');
            ignore.push(selector + ' [data-tts]');
        }

        this.ignore = ignore.join(',');

        this.bindClickableLines();
    }

    private onTtsItemClick(event: MouseEvent) {
        const element = <HTMLElement>event.currentTarget;
        const ttsItem: TimingMetaInterface = this.ttsItemForElement(element);

        if (!ttsItem) {
            return;
        }

        this.updateActiveTtsItem(ttsItem, element);

        this.audio.currentTime = ttsItem.start;
        if (this.audio.paused) {
            this.audio.play();
        }
    }

    private getActiveTtsItem(time: number): TimingMetaInterface | undefined {
        /**
         * Adds a little timing offset to avoid having clicked lines to
         * highlight the previous line when the timing is a little off (this
         * happens because we are using time in floats (seconds)).
         * This also helps avoid spots where the next line (that is ignored using
         * the selector option) sometimes plays a little bit of audio.
         */
        const timingOffset = 0.25;
        for (let i = 0; i < this.timing.length; i++) {
            const timing = this.timing[i];
            if (time >= timing.start - timingOffset && time < timing.end - timingOffset) {
                return timing;
            }
        }
    }

    private updateActiveTtsItem(
        item: TimingMetaInterface | undefined,
        element?: HTMLElement,
    ) {
        if (item === this.activeTtsItem) {
            return;
        }

        const elements = this.content.getElementsByClassName(this.options.classes.active);
        for (let i = 0; i < elements.length; i++) {
            elements[i].classList.remove(this.options.classes.active);
        }

        if (item) {
            if (!element) {
                element = this.elementForTtsItem(item);
            }

            if (element) {
                element.classList.add(this.options.classes.active);
                this.updateScrollPosition(element);
            }
        }

        this.activeTtsItem = item;
    }

    private onTimeUpdate(event) {
        const callback = this.options?.events?.onTimeUpdate;
        if (callback && typeof(callback) === 'function') {
            callback(event, this);
        }

        let ignored = false;
        let activeTtsItem: TimingMetaInterface | undefined = undefined;

        do {
            activeTtsItem = this.getActiveTtsItem(this.audio.currentTime);
            if (!activeTtsItem) {
                break;
            }

            const element: HTMLElement | undefined = this.elementForTtsItem(activeTtsItem);
            if (!element || this.ignore && element.matches(this.ignore)) {
                this.audio.currentTime = activeTtsItem.end;
                continue;
            }

            break;
        } while (true);

        this.updateActiveTtsItem(activeTtsItem);
    }

    // This is some massive function as we need to respect our ignore selectors.
    public get next(): TimingMetaInterface {
        if (!Array.isArray(this.timing)) {
            return;
        }

        let offset: number = 0,
            next: TimingMetaInterface,
            element: HTMLElement | undefined;

        const activeIndex = this.timing.indexOf(this.activeTtsItem);

        do {
            offset++;
            if (activeIndex + offset >= this.timing.length) {
                next = undefined;
                break;
            }

            next = this.timing[activeIndex + offset];
            element = this.elementForTtsItem(next);
        } while (!element || this.ignore && element.matches(this.ignore));

        return next;
    }

    public get previous(): TimingMetaInterface {
        if (!Array.isArray(this.timing)) {
            return;
        }

        let offset: number = 0,
            previous: TimingMetaInterface,
            element: HTMLElement | undefined;

        const activeIndex = this.timing.indexOf(this.activeTtsItem);

        do {
            offset++;
            if (activeIndex - offset < 0) {
                previous = undefined;
                break;
            }

            previous = this.timing[activeIndex - offset];
            element = this.elementForTtsItem(previous);
        } while (!element || this.ignore && element.matches(this.ignore));

        return previous;
    }

    private onVolumeChange(event) {
        const callback = this.options?.events?.onVolumeChange;
        if (callback && typeof(callback) === 'function') {
            callback(event, this);
        }

        this.storage.set('volume', this.audio.volume);
    }

    private onError(event: Event) {
        const callback = this.options?.events?.onError;
        if (callback && typeof(callback) === 'function') {
            callback(event, this);
        }

        console.error(event);
    }

    private onEnded(event: Event) {
        const callback = this.options?.events?.onEnded;
        if (callback && typeof(callback) === 'function') {
            callback(event, this);
        }
    }

    private elementForTtsItem(item: TimingMetaInterface): HTMLElement {
        return document.querySelector<HTMLElement>('[data-tts="' + item.hash + '"][data-tts-index="' + item.index + '"]');
    }

    private ttsItemForElement(element: HTMLElement): TimingMetaInterface {
        return this.timing.find(i => i.hash === element.dataset.tts && i.index === parseInt(element.dataset.ttsIndex));
    }

    private updateScrollPosition(element: HTMLElement) {
        if (!element || !this.options.scrollToActiveLine) {
            return;
        }

        element.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
        });
    }
}
