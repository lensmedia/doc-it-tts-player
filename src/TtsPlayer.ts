import OptionsInterface from './OptionsInterface';

import { TtsError } from './Errors';
import { TtsMetaInterface } from './TtsMetaInterface';

import { formatTime } from './Utils';
import { TtsMetaTimingInterface } from './TtsMetaTimingInterface';

function clamp(number, min, max) {
    return Math.max(Math.min(number, max), min);
}

export default class TtsPlayer {
    public options: OptionsInterface = {
        player: undefined,
        content: undefined,

        document: '',
        tts: 'tts.json',
    };

    private audio: HTMLAudioElement;
    private tts: TtsMetaInterface;

    private _currentTts: TtsMetaTimingInterface;

    set currentTts(value: TtsMetaTimingInterface) {
        if (this._currentTts) {
            const current = document.querySelector(`[data-tts="${this.currentTts}"].tts-active`);
            if (current) {
                current.classList.remove('tts-active');
            }
        }

        this._currentTts = value;

        if (value) {
            const newActiveTtsItem = document.querySelector(`[data-tts="${this.currentTts}"]`);
            if (newActiveTtsItem) {
                newActiveTtsItem.classList.add('tts-active');
            }
        }
    }

    get currentTts() {
        return this._currentTts;
    }

    private player: HTMLElement;
    private content: HTMLElement;

    private dragging: HTMLElement | undefined = undefined;

    private controls: { [key: string]: HTMLElement } = {
        play: undefined,
        pause: undefined,
        volume: undefined,
        volumeBar: undefined,
        time: undefined,
        duration: undefined,
        progress: undefined,
        progressBar: undefined,
    };

    constructor(options) {
        this.options = Object.assign(this.options, options);

        this.player = <HTMLElement>(typeof (this.options.player) === 'string'
            ? document.querySelector(this.options.player)
            : this.options.player);

        this.player.classList.add('tts-player');

        this.content = <HTMLElement>(typeof (this.options.content) === 'string'
            ? document.querySelector(this.options.content)
            : this.options.content);

        this.content.classList.add('tts-content');

        // // Check our content div for tts elements.
        // let content = typeof (this.options.content) === 'string'
        //     ? document.querySelector(this.options.content)
        //     : this.options.content;
        //
        // if (content instanceof Element) {
        //     const elements = content.querySelectorAll('[data-tts]');
        //     for (let i = 0; i < elements.length; i++) {
        //         const element = elements[i];
        //
        //         this.elements.push(<HTMLElement>element);
        //     }
        // }

        this.initializeTemplateComponents();

        // Load our tts meta json file thingy.
        fetch(this.options.document + '/' + this.options.tts)
            .then(response => {
                if (!response.ok) {
                    throw new TtsError('Error loading timing file.');
                }

                return response.json();
            })
            .then(json => {
                this.tts = json;
                this.initializeAudio(this.options.document + '/' + json.file);
            });
    }

    private initializeAudio(source) {
        this.audio = new Audio(source);

        this.audio.addEventListener('timeupdate', this.onTimeUpdate.bind(this));
        this.audio.addEventListener('error', this.onError.bind(this));
        this.audio.addEventListener('durationchange', e => {
            if (!this.controls.duration) {
                return;
            }

            this.controls.duration.innerText = formatTime(this.audio.duration);
        });

        this.controls.duration.innerText = formatTime(0);
        this.updateTimeDisplay(this.audio.currentTime);

        const elements = this.content.querySelectorAll('[data-tts]');
        for (let i = 0; i < elements.length; i++) {
            const element: HTMLElement = <HTMLElement>elements[i];

            element.addEventListener('click', (event) => {
                const ttsItem: TtsMetaTimingInterface = this.tts.timing.find(i => i.hash === element.dataset.tts);
                if (ttsItem) {
                    this.currentTts = ttsItem;

                    this.audio.currentTime = ttsItem.start;
                    this.audio.play();
                }
            });
        }
    }

    private bindEvents(element: HTMLElement, eventString: string, callback: Function): HTMLElement {
        if (!element) {
            return undefined;
        }

        const events = eventString.split(/\s+/);
        for (let i = 0; i < events.length; i++) {
            // @ts-ignore
            element.addEventListener(events[i], callback.bind(this));
        }

        return element;
    }

    private initializeTemplateComponents() {
        this.controls.play = this.player.querySelector('.tts-play');
        this.bindEvents(this.controls.play, 'click', this.onPlay);

        this.controls.pause = this.player.querySelector('.tts-pause');
        this.bindEvents(this.controls.pause, 'click', this.onPause);

        this.controls.volume = this.player.querySelector('.tts-volume');
        this.bindEvents(this.controls.volume, 'mousedown touchstart', this.onProgressBarEvent);

        this.controls.volume = this.player.querySelector('.tts-volume');
        this.controls.volume.appendChild(document.createElement('div'));
        this.bindEvents(this.controls.volume, 'mousedown touchstart', this.onProgressBarEvent);
        this.controls.volumeBar = <HTMLElement>this.controls.volume.firstElementChild;
        this.controls.volumeBar.classList.add('tts-progress-bar');

        this.controls.time = this.player.querySelector('.tts-time');
        this.controls.duration = this.player.querySelector('.tts-duration');

        this.controls.progress = this.player.querySelector('.tts-progress');
        this.controls.progress.appendChild(document.createElement('div'));
        this.bindEvents(this.controls.progress, 'mousedown touchstart', this.onProgressBarEvent);
        this.controls.progressBar = <HTMLElement>this.controls.progress.firstElementChild;
        this.controls.progressBar.classList.add('tts-progress-bar');

        // Progressbar move/end should trigger on body if the button was pressed some time.
        this.bindEvents(document.body, 'mousemove mouseup touchmove touchend', this.onProgressBarEvent);
    }

    public play(hash?: string) {
        if (!this.audio) {
            return;
        }

        this.controls.pause.classList.remove('tts-hidden');
        this.controls.play.classList.add('tts-hidden');

        // audio.currentTime
        // audio.duration
        this.audio.play();
    }

    public pause() {
        this.controls.pause.classList.add('tts-hidden');
        this.controls.play.classList.remove('tts-hidden');

        this.audio.pause();
    }

    public stop() {
    }

    public volume(volume: number) {
        if (!this.controls.volumeBar) {
            return;
        }

        this.controls.volumeBar.style.width = volume * 100 + '%';
    }

    public progress(progress: number) {
        if (!this.audio) {
            return;
        }

        this.audio.currentTime = this.audio.duration * progress;
    }

    private onPlay(event: Event) {
        this.play();
        console.log(event);
    }

    private onPause(event: Event) {
        this.pause();
        console.log(event);
    }

    private updateTimeDisplay(time: number = 0) {
        if (!this.controls.time) {
            return;
        }

        this.controls.time.innerText = formatTime(time);
    }

    private onProgressBarEvent(event: MouseEvent) {
        const target = <HTMLElement>event.currentTarget;
        if ((target === this.controls.volume) || (target === this.controls.progress)) {
            this.dragging = target;
        }

        if (!this.dragging) {
            return;
        }

        if (['mouseup', 'touchend'].indexOf(event.type) !== -1) {
            this.dragging = undefined;
            return;
        }

        const rect = this.dragging.getBoundingClientRect();
        const value = clamp((event.pageX - rect.left) / (rect.right - rect.left), 0, 1);

        if (this.dragging === this.controls.volume) {
            this.volume(value);
        } else if (this.dragging === this.controls.progress) {
            this.progress(value);
        }
    }

    private onTimeUpdate(event: Event) {
        const time = this.audio.currentTime;
        this.updateTimeDisplay(time);

        if (!this.controls.progressBar) {
            return;
        }

        const activeTtsItem = this.getActiveTtsItem(time);
        if (this.currentTts !== activeTtsItem) {
            this.currentTts = activeTtsItem;
        }

        this.controls.progressBar.style.width = (this.audio.currentTime / this.audio.duration) * 100 + '%';
    }

    private getActiveTtsItem(time: Number) {
        const items = this.tts.timing;
        for (let i = 0; i < items.length; i++) {
            if (time >= items[i].start && time < items[i].end) {
                return items[i];
            }
        }
    }

    private onError(event: Event) {
        this.audio = undefined;

        // @ts-ignore (check potential missing index using the log above).
        const error = event.error;
        if (!error) {
            throw new TtsError('An unknown error occurred.');
        }

        this.player.hidden = true;

        throw new TtsError(error.message);
    }
}
