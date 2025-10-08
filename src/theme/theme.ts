import {createSystem, defineConfig, defaultConfig} from "@chakra-ui/react";

const config = defineConfig({
    theme: {
        tokens: {
            colors: {
                white: {value: "#FFFFFF"},
                black: {value: "#000000"},
                primary: {
                    10: {value: "#00210B"},
                    20: {value: "#003918"},
                    30: {value: "#005225"},
                    40: {value: "#006D34"},
                    50: {value: "#008943"},
                    60: {value: "#25A557"},
                    70: {value: "#48C16F"},
                    80: {value: "#66DE88"},
                    90: {value: "#ADF3B9"},
                    95: {value: "#C4FFCC"},
                    99: {value: "#F5FFF2"},
                },
                secondary: {
                    10: {value: "#08200F"},
                    20: {value: "#1E3623"},
                    30: {value: "#344C38"},
                    40: {value: "#4B644F"},
                    50: {value: "#647D66"},
                    60: {value: "#7D977F"},
                    70: {value: "#97B299"},
                    80: {value: "#B2CEB3"},
                    90: {value: "#CDEACE"},
                    95: {value: "#DBF8DC"},
                    99: {value: "#F5FFF2"},
                },
                tertiary: {
                    10: {value: "#001F25"},
                    20: {value: "#00363E"},
                    30: {value: "#004E5A"},
                    40: {value: "#266772"},
                    50: {value: "#43808C"},
                    60: {value: "#5E9AA6"},
                    70: {value: "#78B5C2"},
                    80: {value: "#94D0DE"},
                    90: {value: "#AFECFA"},
                    95: {value: "#D4F7FF"},
                    99: {value: "#F7FDFF"},
                },
                error: {
                    10: {value: "#410002"},
                    20: {value: "#690005"},
                    30: {value: "#93000A"},
                    40: {value: "#BA1A1A"},
                    50: {value: "#DE3730"},
                    60: {value: "#FF5449"},
                    70: {value: "#FF897D"},
                    80: {value: "#FFB4AB"},
                    90: {value: "#FFDAD6"},
                    95: {value: "#FFEDEA"},
                    99: {value: "#FFFBFF"},
                },
                neutral: {
                    10: {value: "#191C19"},
                    20: {value: "#2E312E"},
                    30: {value: "#454744"},
                    40: {value: "#5D5F5B"},
                    50: {value: "#757873"},
                    60: {value: "#8F918D"},
                    70: {value: "#AAACA7"},
                    80: {value: "#C5C7C2"},
                    90: {value: "#E2E3DE"},
                    95: {value: "#F0F1EC"},
                    99: {value: "#F5FFF2"},
                },
                neutralVariant: {
                    10: {value: "#161D17"},
                    20: {value: "#2B322B"},
                    30: {value: "#414941"},
                    40: {value: "#596058"},
                    50: {value: "#717970"},
                    60: {value: "#8B938A"},
                    70: {value: "#A6ADA4"},
                    80: {value: "#C1C9BE"},
                    90: {value: "#DDE5DA"},
                    95: {value: "#EBF3E8"},
                    99: {value: "#F5FFF2"},
                },
            },
            fonts: {
                body: {value: "Inter, system-ui, sans-serif"},
            },
        },
        semanticTokens: {
            colors: {
                brand: {
                    solid: {value: {base: "{colors.primary.40}", _dark: "{colors.primary.80}"}},
                    contrast: {value: {base: "{colors.primary.99}", _dark: "{colors.primary.10}"}},
                    fg: {value: {base: "{colors.primary.40}", _dark: "{colors.primary.80}"}},
                    muted: {value: {base: "{colors.secondary.95}", _dark: "{colors.secondary.30}"}},
                    subtle: {value: {base: "{colors.neutral.99}", _dark: "{colors.neutral.10}"}},
                    emphasized: {value: {base: "{colors.primary.40}", _dark: "{colors.primary.80}"}},
                    focusRing: {value: {base: "{colors.primary.40}", _dark: "{colors.primary.80}"}},
                },
                primary: {
                    value: {base: "{colors.primary.40}", _dark: "{colors.primary.80}"},
                },
                onPrimary: {
                    value: {base: "{colors.white}", _dark: "{colors.primary.20}"},
                },
                primaryContainer: {
                    value: {base: "{colors.primary.90}", _dark: "{colors.primary.30}"},
                },
                onPrimaryContainer: {
                    value: {base: "{colors.primary.10}", _dark: "{colors.primary.90}"},
                },

                secondary: {
                    value: {
                        base: "{colors.secondary.40}",
                        _dark: "{colors.secondary.80}",
                    },
                },
                onSecondary: {
                    value: {base: "{colors.white}", _dark: "{colors.secondary.20}"},
                },
                secondaryContainer: {
                    value: {
                        base: "{colors.secondary.90}",
                        _dark: "{colors.secondary.30}",
                    },
                },
                onSecondaryContainer: {
                    value: {
                        base: "{colors.secondary.10}",
                        _dark: "{colors.secondary.90}",
                    },
                },

                tertiary: {
                    value: {
                        base: "{colors.tertiary.40}",
                        _dark: "{colors.tertiary.80}",
                    },
                },
                onTertiary: {
                    value: {base: "{colors.white}", _dark: "{colors.tertiary.20}"},
                },
                tertiaryContainer: {
                    value: {
                        base: "{colors.tertiary.90}",
                        _dark: "{colors.tertiary.30}",
                    },
                },
                onTertiaryContainer: {
                    value: {
                        base: "{colors.tertiary.10}",
                        _dark: "{colors.tertiary.90}",
                    },
                },

                error: {
                    value: {base: "{colors.error.40}", _dark: "{colors.error.80}"},
                },
                onError: {
                    value: {base: "{colors.white}", _dark: "{colors.error.20}"},
                },
                errorContainer: {
                    value: {base: "{colors.error.90}", _dark: "{colors.error.30}"},
                },
                errorSubtle: {
                    value: {base: "{colors.error.90}", _dark: "{colors.error.10}"},
                },
                onErrorContainer: {
                    value: {base: "{colors.error.10}", _dark: "{colors.error.90}"},
                },

                background: {
                    value: {base: "{colors.neutral.99}", _dark: "{colors.neutral.10}"},
                },
                onBackground: {
                    value: {base: "{colors.neutral.10}", _dark: "{colors.neutral.90}"},
                },
                surface: {
                    value: {base: "{colors.neutral.99}", _dark: "{colors.neutral.10}"},
                },
                onSurface: {
                    value: {base: "{colors.neutral.10}", _dark: "{colors.neutral.90}"},
                },
                backface: {
                    value: {base: "{colors.white}", _dark: "{colors.black}"},
                },

                surfaceVariant: {
                    value: {
                        base: "{colors.neutralVariant.90}",
                        _dark: "{colors.neutralVariant.30}",
                    },
                },
                onSurfaceVariant: {
                    value: {
                        base: "{colors.neutralVariant.30}",
                        _dark: "{colors.neutralVariant.80}",
                    },
                },
                outline: {
                    value: {
                        base: "{colors.neutralVariant.50}",
                        _dark: "{colors.neutralVariant.60}",
                    },
                },
                outlineVariant: {
                    value: {
                        base: "{colors.neutralVariant.80}",
                        _dark: "{colors.neutralVariant.30}",
                    },
                },
            },
        },
    },
});

export const system = createSystem(defaultConfig, config);
