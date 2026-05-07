const themeManager = {
    activeTheme: null,
    boyLink: null,
    girlLink: null,
    
    init() {
        if (typeof theme !== 'undefined') {
            this.activeTheme = theme;
        }
        this.createLinks();
    },
    
    createLinks() {
        this.boyLink = document.createElement('link');
        this.boyLink.rel = 'stylesheet';
        this.boyLink.href = '/static/styles/colors/boy.css';
        
        this.girlLink = document.createElement('link');
        this.girlLink.rel = 'stylesheet';
        this.girlLink.href = '/static/styles/colors/girl.css';
        
        document.head.appendChild(this.boyLink);
        document.head.appendChild(this.girlLink);
    },
    
    apply(gender = null) {
        if (!this.activeTheme && typeof theme !== 'undefined') {
            this.activeTheme = theme;
        }
        
        if (!this.activeTheme) {
            return;
        }
        
        const themeData = this.activeTheme.getTheme(gender);
        const colors = themeData.colors;
        
        const root = document.documentElement;
        root.style.setProperty('--primary', colors.primary);
        root.style.setProperty('--primary-dark', colors.primaryDark);
        root.style.setProperty('--primary-light', colors.primaryLight);
        root.style.setProperty('--secondary', colors.secondary);
        root.style.setProperty('--secondary-light', colors.secondaryLight);
        root.style.setProperty('--accent', colors.accent);
        root.style.setProperty('--accent-light', colors.accentLight);
        root.style.setProperty('--success', colors.success);
        root.style.setProperty('--success-light', colors.successLight);
        root.style.setProperty('--danger', colors.danger);
        root.style.setProperty('--danger-light', colors.dangerLight);
        root.style.setProperty('--magic', colors.magic);
        root.style.setProperty('--magic-light', colors.magicLight);
        root.style.setProperty('--dark', colors.dark);
        root.style.setProperty('--dark-brown', colors.darkBrown);
        root.style.setProperty('--brown', colors.brown);
        root.style.setProperty('--light-brown', colors.lightBrown);
        root.style.setProperty('--light', colors.light);
        root.style.setProperty('--light-gold', colors.lightGold);
        root.style.setProperty('--white', colors.white);
        
        document.body.style.background = themeData.gradient;
        
        this.updateStylesheet(gender);
    },

    updateStylesheet(gender) {
        if (gender === 'boy') {
            this.boyLink.disabled = false;
            this.girlLink.disabled = true;
        } else if (gender === 'girl') {
            this.boyLink.disabled = true;
            this.girlLink.disabled = false;
        } else {
            this.boyLink.disabled = true;
            this.girlLink.disabled = true;
        }
    },

    getTheme(gender = null) {
        if (!this.activeTheme) {
            this.init();
            return { colors: {}, gradient: '', characters: {} };
        }
        return this.activeTheme.getTheme(gender);
    }
};

themeManager.init();