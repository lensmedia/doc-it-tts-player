import CssSelector from './Type/CssSelector';

export default interface PlayerOptionsInterface {
    element: CssSelector,
    classes?: {
        minimized?: string,
        maximized?: string,
        loading?: string,
    },
    controls?: {
        minimize?: CssSelector,
        maximize?: CssSelector,
        play?: CssSelector,
        pause?: CssSelector,
        previous?: CssSelector,
        next?: CssSelector,
        time?: CssSelector,
        duration?: CssSelector,
        volume?: CssSelector,
        volumeBar?: CssSelector,
        volumePercentage?: CssSelector,
        progress?: CssSelector,
        progressBar?: CssSelector,
    },
}
