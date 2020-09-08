function pad(value: string | number, length: number = 2) {
    let pad = '';
    for (let i = 0; i < (length - value.toString().length); i++) {
        pad += '0';
    }

    return pad + value;
}

export function formatTime(duration: number): string {
    const hours = Math.floor(duration / 3600);
    duration %= 3600;

    const minutes = Math.floor(duration / 60);
    duration %= 60;

    const seconds = Math.floor(duration % 60);

    // duration %= 60;
    // const miliseconds = Math.floor(duration % 60);

    return (hours ? `${pad(hours)}:` : '') + `${pad(minutes)}:${pad(seconds)}`;
}
