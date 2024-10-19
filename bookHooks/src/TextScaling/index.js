import { Dimensions } from "react-native";

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Base scale factor
const baseScale = Math.min(screenWidth, screenHeight) / 375; // Assuming 375 is the base width (e.g., iPhone 6/7/8)

const TextSizeType = {
    Scale: {
        Tiny: baseScale * 12,    // Captions, disclaimers (~12px base)
        XSmall: baseScale * 14,  // Labels, small buttons (~14px base)
        Small: baseScale * 16,   // Secondary text (~16px base)
        Body: baseScale * 18,    // Standard paragraphs (~18px base)
        Medium: baseScale * 20,  // Slightly larger body text (~20px base)
        Large: baseScale * 22,   // Prominent body text (~22px base)
        XLarge: baseScale * 24,  // Subheadings (~24px base)
        XXLarge: baseScale * 28, // Major headings (~28px base)
        H1: baseScale * 32,      // Main headings (~32px base)
        H2: baseScale * 28,      // Secondary headings (~28px base)
        H3: baseScale * 24,      // Tertiary headings (~24px base)
        H4: baseScale * 22,      // Fourth-level headings (~22px base)
        H5: baseScale * 20,      // Fifth-level headings (~20px base)
        H6: baseScale * 18,      // Sixth-level headings (~18px base)
    }
}

const TextSize = TextSizeType.Scale;
export default TextSize;

// Usage Guidance:
// Tiny: Captions, disclaimers, footnotes.
// XSmall: Labels, small buttons.
// Small: Secondary text, less prominent information.
// Body: Standard paragraphs, general content.
// Medium: Slightly larger body text or secondary headings.
// Large: Prominent body text or primary buttons.
// XLarge: Subheadings or highlighted content.
// XXLarge: Major headings or key titles.
// H1-H6: Hierarchical headings with H1 being the largest.
