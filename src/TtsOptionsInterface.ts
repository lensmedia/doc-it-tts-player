import CssSelector from './Type/CssSelector';
import PlayerOptionsInterface from './PlayerOptionsInterface';

export default interface TtsOptionsInterface {
    /**
     * Element reference to the area where the our player controls will be
     * placed. Can be css selector or HTMLElement.
     */
    player: PlayerOptionsInterface,

    /**
     * Element reference to the area where the exported document fragment is.
     * This is used to highlight currently active lines etc. Can be css
     * selector or HTMLElement.
     */
    content: CssSelector,

    /** Values for classes applied to elements by our player. */
    classes: {
        /** The class applied to line elements clickable for playing. */
        playable: string,

        /** The class applied to line element currently playing (or paused at). */
        active: string,
    },

    /** The location our document. */
    document: string,

    /** The tts filename (defaults to tts.json). */
    tts: string,

    /** Array with CSS selectors of elements we should not play. */
    ignore: string[],

    /** Scroll while keeping the currently playing line on screen, default true. */
    scrollToActiveLine: boolean,

    /** Enable the ability to click on lines to play the audio, default true. */
    enableClickableLines: boolean,

    /**
     * The time that is allowed between clicks/presses to account for a double
     * click. Set/ defaults to 0 and will disable double click behaviour and
     * use single click/tap instead.
     */
    // doubleClickDuration: number
}
