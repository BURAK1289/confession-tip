# App Assets Guide

## Required Assets for Base Mini App

### Icons
- **app-icon.svg** ✅ Created (512x512)
  - Use this as base for generating PNG versions
  - Convert to PNG: 192x192, 512x512

### How to Generate PNG Icons:
```bash
# Using ImageMagick or online converter
# Convert SVG to PNG at different sizes
convert app-icon.svg -resize 192x192 icon-192x192.png
convert app-icon.svg -resize 512x512 icon-512x512.png
```

### Online Tools:
- https://www.miniappassets.com/ - Mini App Assets Generator
- https://cloudconvert.com/svg-to-png - SVG to PNG converter
- https://www.figma.com - Design custom icons

### Screenshots Needed:
1. **Feed Page** - Main confession feed with categories
2. **Leaderboard** - Top confessions view
3. **Profile** - User stats and confessions
4. **Tip Flow** - Tipping interaction

### Screenshot Specs:
- Size: 1284x2778px (iPhone 14 Pro)
- Format: PNG
- Show actual app functionality
- Include wallet connected state

### Splash Screen:
- Size: 1170x2532px
- Should match app branding
- Simple, clean design
- Fast loading

## Current Status:
- ✅ SVG icon created (app-icon.svg)
- ⏳ PNG conversions needed
- ⏳ Screenshots needed (take after testing)
- ⏳ Splash screen needed

## Next Steps:
1. Convert SVG to PNG (192x192, 512x512)
2. Test app and take screenshots
3. Create splash screen
4. Update minikit.config.ts with asset URLs
