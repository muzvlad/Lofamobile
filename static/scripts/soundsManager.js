const soundsManager = {
    enabled: true,

    init() {},

    play(soundName) {
        if (!this.enabled) return;
    },

    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = soundsManager;
}