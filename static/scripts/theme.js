const theme = {
    name: 'WoW Kids',
    
    neutral: {
        colors: {
            primary: '#5B8C5A',
            primaryDark: '#3B5C3A',
            primaryLight: '#7BAC7A',
            secondary: '#8B6914',
            secondaryLight: '#AB8924',
            accent: '#D4A017',
            accentLight: '#E4B027',
            success: '#4A7B3A',
            successLight: '#6A9B4A',
            danger: '#8B3A3A',
            dangerLight: '#AB5A5A',
            magic: '#5A3A8B',
            magicLight: '#7A5AAB',
            dark: '#2A2A2A',
            darkBrown: '#3D2B1A',
            brown: '#5A402A',
            lightBrown: '#7A604A',
            light: '#E8E0D0',
            lightGold: '#F8F0E0',
            white: '#FFF8F0'
        },
        gradient: 'linear-gradient(180deg, #5B8C5A 0%, #7BAC7A 50%, #3B5C3A 100%)'
    },
    
    boy: {
        colors: {
            primary: '#1E4D6B',
            primaryDark: '#153A4F',
            primaryLight: '#2A6B8C',
            secondary: '#6B4423',
            secondaryLight: '#8B5A2B',
            accent: '#C9A227',
            accentLight: '#DBB94A',
            success: '#3D8B37',
            successLight: '#5CB850',
            danger: '#8B2500',
            dangerLight: '#C9302C',
            magic: '#7B3F9D',
            magicLight: '#9B5FBF',
            dark: '#1A1A1A',
            darkBrown: '#2D1F14',
            brown: '#4A3520',
            lightBrown: '#6B4D2E',
            light: '#E8DCC8',
            lightGold: '#F5E6C8',
            white: '#FFF8E7'
        },
        gradient: 'linear-gradient(180deg, #1E4D6B 0%, #2A6B8C 50%, #153A4F 100%)'
    },
    
    girl: {
        colors: {
            primary: '#D4A5B5',
            primaryDark: '#B8859A',
            primaryLight: '#E8C5D0',
            secondary: '#C9A5C0',
            secondaryLight: '#DCC5D8',
            accent: '#E8B5D0',
            accentLight: '#F5D5E5',
            success: '#B87AA5',
            successLight: '#D8A5C8',
            danger: '#C48595',
            dangerLight: '#D8A5B5',
            magic: '#C485A5',
            magicLight: '#D8A5C5',
            dark: '#3A2A30',
            darkBrown: '#4A383F',
            brown: '#6A4855',
            lightBrown: '#8A6875',
            light: '#F5E8ED',
            lightGold: '#FAF0F5',
            white: '#FFFAFC'
        },
        gradient: 'linear-gradient(180deg, #D4A5B5 0%, #E8C5D0 50%, #B8859A 100%)'
    },
    
    characters: {
        boy: { emoji: '🔨', name: 'Строитель', desc: 'Мастер постройки' },
        girl: { emoji: '🍳', name: 'Кулинар', desc: 'Мастер кулинарии' }
    },

    performerImages: {
        builder: 'assets/characters/builder.webp',
        cook: 'assets/characters/cook.webp',
        pilot: 'assets/characters/pilot.webp',
        engineer_girl: 'assets/characters/engineer_girl.webp',
        robot_pink: 'assets/characters/robot_pink.webp',
        robot_grey: 'assets/characters/robot_grey.webp'
    },

    getCharacterImage(performer) {
        return this.performerImages[performer] || this.performerImages.builder;
    },
    
    items: {
        crystal: '💎',
        heart: '💖',
        flag: '🚩',
        star: '⭐',
        lock: '🔒'
    },

    getTheme(gender) {
        if (!gender) {
            return {
                ...this.neutral,
                characters: this.characters,
                items: this.items
            };
        }
        const theme = gender === 'girl' ? this.girl : this.boy;
        return {
            ...theme,
            characters: this.characters,
            items: this.items
        };
    }
};

function getCharacterEmoji(gender) {
    return theme.characters[gender]?.emoji || '⚔️';
}

function getItemEmoji(type) {
    return theme.items[type] || '💎';
}