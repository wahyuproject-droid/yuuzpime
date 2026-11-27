import { PaletteType } from "@/types/TailwindCSS/Palette.type";

export type AccentColorsType = Extract<PaletteType,
    "neutral"
    | "red"
    | "orange"
    | "amber"
    | "yellow"
    | "lime"
    | "green"
    | "emerald"
    | "teal"
    | "cyan"
    | "sky"
    | "blue"
    | "indigo"
    | "violet"
    | "purple"
    | "fuchsia"
    | "pink"
    | "rose"
>;