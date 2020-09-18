import CssSelector from './Type/CssSelector';

function pad(value: string | number, length: number = 2, char: string = '0'): string {
    let pad = '';
    for (let i = 0; i < (length - value.toString().length); i++) {
        pad += char;
    }

    return pad + value;
}

export function formatTime(duration: number): string {
    // Avoid nan's.
    duration = duration || 0;

    const hours = Math.floor(duration / 3600);
    duration %= 3600;

    const minutes = Math.floor(duration / 60);
    duration %= 60;

    const seconds = Math.floor(duration % 60);

    // duration %= 60;
    // const miliseconds = Math.floor(duration % 60);

    return (hours ? `${pad(hours)}:` : '') + `${pad(minutes)}:${pad(seconds)}`;
}

export function selectorArgToElement(
    element: CssSelector,
    scope: ParentNode = document
): HTMLElement {
    if (typeof (element) === 'string') {
        element = scope.querySelector(element);
    }

    return <HTMLElement>element;
}

export function clamp(number: number, min: number = 0, max: number = 1): number {
    return Math.max(Math.min(number, max), min);
}

export function eventCoords(event, which: number = 0): MouseEvent | Touch {
    if (undefined !== event.changedTouches) {
        event = event.changedTouches[which || event.which || 0];
    }

    return event;
}
