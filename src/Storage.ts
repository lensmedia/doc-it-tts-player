export default class Storage {
    private readonly available: boolean;
    private readonly prefix: string;

    constructor(prefix: string = '') {
        this.prefix = prefix;

        const test = 'test';
        try {
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            this.available = true;
        } catch(e) {
            throw new Error('Local storage is not available.');
        }
    }

    set(key: string, value: any) {
        if (!this.available) {
            return;
        }

        localStorage.setItem(this.prefix + key, JSON.stringify(value));
    }

    get(key: string, defaultValue?: any) {
        if (!this.available) {
            return defaultValue;
        }

        const value = localStorage.getItem(this.prefix + key);

        return null === value
            ? defaultValue
            : JSON.parse(value);
    }
}
