import Tts from './Tts';

import PlayerOptionsInterface from './PlayerOptionsInterface';
import CssSelector from './Type/CssSelector';

import { clamp, eventCoords, formatTime, selectorArgToElement } from './Utils';
import Storage from './Storage';

const previousOrItemStartLimit: number = 1; // seconds.

export default class Player {
    private readonly tts: Tts;

    private get audio(): HTMLAudioElement {
        return this.tts.audio;
    }

    private get storage(): Storage {
        return this.tts.storage;
    }

    private readonly player: HTMLElement;

    private readonly options: PlayerOptionsInterface = {
        element: undefined,
        classes: {
            minimized: 'tts-minimized',
            maximized: 'tts-maximized',
        },
        controls: {
            minimize: '[data-tts-minimize]',
            maximize: '[data-tts-maximize]',
            play: '[data-tts-play]',
            pause: '[data-tts-pause]',
            previous: '[data-tts-previous]',
            next: '[data-tts-next]',
            volume: '[data-tts-volume]',
            volumeBar: '[data-tts-volume-bar]',
            volumePercentage: '[data-tts-volume-percentage]',
            time: '[data-tts-time]',
            duration: '[data-tts-duration]',
            progress: '[data-tts-progress]',
            progressBar: '[data-tts-progress-bar]',
        },
    };

    // Control fields.
    private minimize: HTMLElement;
    private maximize: HTMLElement;
    private play: HTMLElement;
    private pause: HTMLElement;
    private previous: HTMLElement;
    private next: HTMLElement;
    private volume: HTMLElement;
    private volumeBar: HTMLElement;
    private volumePercentage: HTMLElement;
    private progress: HTMLElement;
    private progressBar: HTMLElement;
    private time: HTMLElement;
    private duration: HTMLElement;

    // Dragging what element tracker (used for progress/volume sliders).
    private dragging: HTMLElement;

    constructor(ttsPlayer: Tts, options: PlayerOptionsInterface) {
        this.tts = ttsPlayer;

        Object.assign(this.options, options);

        const element = selectorArgToElement(this.options.element);
        element.dataset.ttsPlayer = '';

        this.player = element;
        this.bind(this.player, 'mousedown touchstart', this.onProgressDragEvents);

        if (this.storage.get('player-maximized')) {
            this.player.classList.add(this.options.classes.maximized);
        }

        if (!this.player.classList.contains(this.options.classes.maximized)) {
            this.player.classList.add(this.options.classes.minimized);
        }

        // Do some controls loading.
        this.initializeMinimizeButton();
        this.initializeMaximizeButton();
        this.initializePlayButton();
        this.initializePauseButton();
        this.initializePreviousButton();
        this.initializeNextButton();
        this.initializeTimeDisplay();
        this.initializeDurationDisplay();
        this.initializeVolumeDisplay();

        // Volume/progress bar drag events.
        this.initializeVolumeProgressBar();
        this.initializeProgressProgressBar();
        this.bind(window, 'mousemove touchmove', this.onProgressDragEvents, false);
        this.bind(window, 'mouseup touchend', this.onProgressDragEvents);

        // Wrapped in set timeout to make it trigger after constructor has
        // finished in our tts class.
        if (this.storage.get('player-maximized') && !this.audio) {
            setTimeout(() => this.tts.initialize());
        }
    }

    public initializeMinimizeButton() {
        this.minimize = selectorArgToElement(this.options.controls.minimize, this.player);
        this.bind(this.minimize, 'click', async e => {
            this.storage.set('player-maximized', false);

            this.player.classList.add(this.options.classes.minimized);
            this.player.classList.remove(this.options.classes.maximized);
        });
    }

    public initializeMaximizeButton() {
        this.maximize = selectorArgToElement(this.options.controls.maximize, this.player);
        this.bind(this.maximize, 'click', async e => {
            if (!this.audio) {
                await this.tts.initialize();
            }

            this.storage.set('player-maximized', true);

            this.player.classList.add(this.options.classes.maximized);
            this.player.classList.remove(this.options.classes.minimized);
        });
    }

    public initializePlayButton() {
        this.play = selectorArgToElement(this.options.controls.play, this.player);

        this.bind(this.play, 'click', (event: MouseEvent) => {
            event.stopPropagation();
            this.audio.play();

            this.storage.set('player-playing', true);
        });
    }

    public initializePauseButton() {
        this.pause = selectorArgToElement(this.options.controls.pause, this.player);

        this.bind(this.pause, 'click', (event: MouseEvent) => {
            event.stopPropagation();
            this.audio.pause();

            this.storage.set('player-playing', false);
        });
    }

    public initializePreviousButton() {
        this.previous = selectorArgToElement(this.options.controls.previous, this.player);

        this.bind(this.previous, 'click', (event: MouseEvent) => {
            event.stopPropagation();

            // Check if we are playing the current item for longer than 500ms.
            // If we are scroll back to the current item start.
            const offset = this.audio.currentTime - this.tts.activeTtsItem.start;
            if (offset > previousOrItemStartLimit) {
                this.audio.currentTime = this.tts.activeTtsItem.start;
                return;
            }

            // Else we check if we have a previous item and scroll to that.
            if (!this.tts.previous) {
                return;
            }


            this.audio.currentTime = this.tts.previous.start;
        });
    }

    public initializeNextButton() {
        this.next = selectorArgToElement(this.options.controls.next, this.player);
        this.bind(this.next, 'click', (event: MouseEvent) => {
            event.stopPropagation();

            if (!this.tts.next) {
                return;
            }

            this.audio.currentTime = this.tts.next.start;
        });
    }

    public initializeTimeDisplay() {
        this.time = selectorArgToElement(this.options.controls.time, this.player);
    }

    public initializeDurationDisplay() {
        this.duration = selectorArgToElement(this.options.controls.duration, this.player);
    }

    public initializeVolumeDisplay() {
        this.volumePercentage = selectorArgToElement(this.options.controls.volumePercentage, this.player);
    }

    public initializeVolumeProgressBar() {
        this.volume = selectorArgToElement(this.options.controls.volume, this.player);
        this.volumeBar = selectorArgToElement(this.options.controls.volumeBar, this.volume);

        this.bind(this.volume, 'mousedown touchstart', this.onProgressDragEvents);
    }

    public initializeProgressProgressBar() {
        this.progress = selectorArgToElement(this.options.controls.progress, this.player);
        this.progressBar = selectorArgToElement(this.options.controls.progressBar, this.progress);

        this.bind(this.progress, 'mousedown touchstart', this.onProgressDragEvents);
    }

    public initializeAudioElement(audio: HTMLAudioElement): HTMLAudioElement {
        // Play state changers.
        this.bind(audio, 'play', () => this.updatePlayingState(true));
        this.bind(audio, 'pause', () => this.updatePlayingState(false));
        this.bind(audio, 'ended', () => this.updatePlayingState(false));

        this.bind(audio, 'timeupdate', this.onTimeUpdate);
        this.onTimeUpdate();

        this.bind(audio, 'durationchange', this.onDurationChange);
        this.onDurationChange();

        this.bind(audio, 'volumechange', this.onVolumeChange);
        this.onVolumeChange();

        return audio;
    }

    private bind(
        element: CssSelector | CssSelector[],
        events: string | string[],
        callback: Function,
        passive: boolean = true,
    ): Player {
        if (typeof (events) === 'string') {
            events = events.split(/\s+/);
        }

        if (!Array.isArray(element)) {
            element = [element];
        }

        // @ts-ignore
        for (let i = 0; i < element.length; i++) {
            element = <HTMLElement>selectorArgToElement(element[i]);
            if (!element) {
                continue;
            }

            for (let j = 0; j < events.length; j++) {
                element.addEventListener(
                    events[j],
                    callback.bind(this),
                    (false === passive)
                        ? { passive }
                        : undefined,
                );
            }
        }

        return this;
    }

    private onTimeUpdate(event?: Event) {
        if (!this.time) {
            return;
        }

        const time = this.audio && this.audio.currentTime || 0;
        const duration = this.audio && this.audio.duration || 0;

        this.time.innerText = formatTime(time);

        if (this.next instanceof HTMLButtonElement) {
            this.next.disabled = undefined === this.tts.next;
        }

        if (this.previous instanceof HTMLButtonElement) {
            const playingCurrentItemFor: number = this.tts.activeTtsItem
                ? this.audio.currentTime - this.tts.activeTtsItem.start
                : 0;

            this.previous.disabled = undefined === this.tts.previous && playingCurrentItemFor < previousOrItemStartLimit;
        }

        if (this.progressBar instanceof HTMLElement) {
            this.progressBar.style.width = (duration ? time / duration : 0) * 100 + '%';
        }
    }

    private onDurationChange(event?: Event) {
        if (!this.duration) {
            return;
        }

        if (this.next instanceof HTMLButtonElement) {
            this.next.disabled = undefined === this.tts.next;
        }

        this.duration.innerText = formatTime(this.audio && this.audio.duration || 0);
    }

    private onVolumeChange(event?: Event) {
        if (!this.audio) {
            return;
        }

        if (this.volumeBar instanceof HTMLElement) {
            this.volumeBar.style.width = this.audio.volume * 100 + '%';
        }

        if (this.volumePercentage instanceof HTMLElement) {
            this.volumePercentage.innerHTML = Math.round(this.audio.volume * 100) + '%';
        }
    }

    private updatePlayingState(playing: boolean) {
        this.player.classList.toggle('playing', playing);
        this.player.classList.toggle('paused', !playing);

        if (this.play instanceof HTMLButtonElement) {
            this.play.disabled = playing;
        }

        if (this.pause instanceof HTMLButtonElement) {
            this.pause.disabled = !playing;
        }
    }

    private onProgressDragEvents(event: MouseEvent | TouchEvent) {
        event.stopPropagation();

        switch (event.type) {
            case 'mousedown':
            case 'touchstart':
                this.dragging = <HTMLElement>event.currentTarget;
                break;

            case 'mouseup':
            case 'touchend':
                this.dragging = undefined;
                break;
        }

        if (!this.dragging) {
            return;
        }

        if (event.type === 'mousemove' || event.type === 'touchmove') {
            event.preventDefault();
        }

        const rect = this.dragging.getBoundingClientRect();
        const coords = eventCoords(event);
        const value = clamp((coords.pageX - rect.left) / (rect.right - rect.left), 0, 1);

        if (this.dragging === this.volume) {
            this.audio.volume = value;
        } else if (this.dragging === this.progress) {
            this.audio.currentTime = value * this.audio.duration;
        }
    }
}
