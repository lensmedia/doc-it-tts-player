export default interface OptionsInterface {
    /**
     * Element reference to the area where the our player controls will be
     * placed. Can be css selector or HTMLElement.
     */
    player: string | Element,

    /**
     * Element reference to the area where the exported document fragment is.
     * This is used to highlight currently active lines etc. Can be css
     * selector or HTMLElement.
     */
    content: string | Element,

    /**
     * The location our document.
     */
    document: string,

    /**
     * The tts filename (defaults to tts.json).
     */
    tts: string,
}

