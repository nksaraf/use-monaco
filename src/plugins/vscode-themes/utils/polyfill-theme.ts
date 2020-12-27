/**
 *
 * switch color for light theme
 * secondary button color
 * collapsible icon
 *
 */
import deepmerge from 'deepmerge';
import Color from 'color';
import { object } from './dot';
import * as designLanguage from './colors';
import codesandboxBlack from '../themes/codesandbox-black';
import codesandboxLight from '../themes/codesandbox-light.json';

const polyfillTheme = (vsCodeTheme) => {
  /**
   *
   * In order of importance, this is the value we use:
   * 1. Value from theme
   * 2. or inferred value from theme
   * 3. or value from codesandbox black/light
   *
   * The steps required to get there are -
   * 1. Take vscode theme
   * 2. Fill missing values based on existing values or codesandbox dark/light
   * 3. Infer values that are not defined by vscode theme
   *
   */
  let uiColors: any = {
    // initialise objects to avoid null checks later
    editor: {},
    button: {},
    input: {},
    inputOption: {},
    list: {},
    sideBar: {},
    activityBar: {},
    titleBar: {},
    quickInput: {},
    editorHoverWidget: {},
    menuList: {},
    dialog: {},
    tab: {},
  };

  const type = vsCodeTheme.type || guessType(vsCodeTheme);

  //  Step 1: Initialise with vscode theme
  const vsCodeColors = object(vsCodeTheme.colors || {});
  uiColors = deepmerge(uiColors, vsCodeColors);

  // Step 2: Fill missing values from existing values or codesandbox dark/light

  const codesandboxColors: any = ['dark', 'lc'].includes(type)
    ? object(codesandboxBlack.colors)
    : object(codesandboxLight.colors);

  // 2.1 First, lets fill in core values that are used to infer other values

  uiColors.foreground = uiColors.foreground || codesandboxColors.foreground;
  uiColors.errorForeground =
    uiColors.errorForeground || codesandboxColors.errorForeground;

  uiColors.sideBar = {
    background:
      uiColors.sideBar.background ||
      uiColors.editor.background ||
      codesandboxColors.sideBar.background,
    foreground:
      uiColors.sideBar.foreground ||
      uiColors.editor.foreground ||
      codesandboxColors.sideBar.foreground,
    border:
      uiColors.sideBar.border ||
      uiColors.editor.lineHighlightBackground ||
      codesandboxColors.sideBar.border,
  };

  uiColors.input = {
    background: uiColors.input.background || uiColors.sideBar.border,
    foreground: uiColors.input.foreground || uiColors.sideBar.foreground,
    border: uiColors.input.border || uiColors.sideBar.border,
    placeholderForeground:
      uiColors.input.placeholderForeground ||
      codesandboxColors.input.placeholderForeground,
  };

  uiColors.quickInput = {
    background: uiColors.quickInput.background || uiColors.sideBar.background,
    foreground: uiColors.quickInput.foreground || uiColors.sideBar.foreground,
  };

  uiColors.editorHoverWidget = {
    background:
      uiColors.editorHoverWidget.background || uiColors.sideBar.background,
    foreground:
      uiColors.editorHoverWidget.foreground || uiColors.sideBar.foreground,
    border: uiColors.editorHoverWidget.border || uiColors.sideBar.border,
  };

  uiColors.inputOption.activeBorder =
    uiColors.inputOption.activeBorder || uiColors.input.placeholderForeground;

  uiColors.button = {
    background:
      uiColors.button.background || codesandboxColors.button.background,
    foreground:
      uiColors.button.foreground || codesandboxColors.button.foreground,
  };

  // Step 3. Infer values that are not defined by vscode theme

  // Step 3.1
  // As all VSCode themes are built for a code editor,
  // the design decisions made in them might not work well
  // for an interface like ours which has other ui elements as well.
  // To make sure the UI looks great, we change some of these design decisions
  // made by the theme author

  const decreaseContrast = type === 'dark' ? lighten : darken;

  const mutedForeground = withContrast(
    uiColors.input.placeholderForeground,
    uiColors.sideBar.background,
    type
  );

  if (uiColors.sideBar.border === uiColors.sideBar.background) {
    uiColors.sideBar.border = decreaseContrast(
      uiColors.sideBar.background,
      0.25
    );
  }

  if (uiColors.sideBar.hoverBackground === uiColors.sideBar.background) {
    uiColors.sideBar.hoverBackground = decreaseContrast(
      uiColors.sideBar.background,
      0.25
    );
  }

  if (uiColors.list.hoverBackground === uiColors.sideBar.background) {
    if (
      uiColors.list.inactiveSelectionBackground &&
      uiColors.list.hoverBackground !==
        uiColors.list.inactiveSelectionBackground
    ) {
      uiColors.list.hoverBackground = uiColors.list.inactiveSelectionBackground;
    } else {
      // if that didnt work, its math time
      uiColors.list.hoverBackground = decreaseContrast(
        uiColors.sideBar.background,
        0.25
      );
    }
  }

  uiColors.list.foreground = uiColors.list.foreground || mutedForeground;
  uiColors.list.hoverForeground =
    uiColors.list.hoverForeground || uiColors.sideBar.foreground;
  uiColors.list.hoverBackground =
    uiColors.list.hoverBackground || uiColors.sideBar.hoverBackground;

  uiColors.titleBar.activeBackground =
    uiColors.titleBar.activeBackground || uiColors.sideBar.background;
  uiColors.titleBar.activeForeground =
    uiColors.titleBar.activeForeground || uiColors.sideBar.foreground;
  uiColors.titleBar.border =
    uiColors.titleBar.border || uiColors.sideBar.border;

  // Step 3.2
  // On the same theme of design decisions for interfaces,
  // we add a bunch of extra elements and interaction.
  // To make these elements look natural with the theme,
  // we infer them from the theme

  // const main = Color(uiColors.editor.background).hsl();
  // const shade = shades(uiColors.editor.background);

  // console.log(uiColors.editor.background);
  // const inverse = (num) =>
  //   main.isLight()
  //     ? darken(uiColors.editor.background, num)
  //     : lighten(uiColors.editor.background, num);

  const addedColors = {
    // shades: shade,
    mutedForeground,
    // browser: {
    //   borderWidth: '0px',
    //   padding: '4px',
    //   background: main.lightness() > 20 ? shade[900] : shade[700],
    // },
    // panel: {
    //   background: uiColors.editor.background,
    // },
    // panelHeader: {
    //   inactiveForeground: inverse(3),
    //   inactiveBackground: inverse(-0.25),
    //   hoveredBackground: inverse(2),
    //   hoveredForeground: inverse(-1.5),
    //   activeBackground: inverse(2),
    //   activeForeground: inverse(-1.5),
    // },
    activityBar: {
      selectedForeground: uiColors.sideBar.foreground,
      inactiveForeground: mutedForeground,
      hoverBackground: uiColors.sideBar.border,
    },
    avatar: { border: uiColors.sideBar.border },
    sideBar: { hoverBackground: uiColors.sideBar.border },
    button: {
      // hoverBackground: `linear-gradient(0deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.2)), ${uiColors.button.background}`,
    },
    secondaryButton: {
      background: uiColors.input.background,
      foreground: uiColors.input.foreground,
      // hoverBackground: `linear-gradient(0deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.2)), ${uiColors.sideBar.border}`,
    },
    dangerButton: {
      background: designLanguage.colors.red[300],
      foreground: '#FFFFFF',
      // hoverBackground: `linear-gradient(0deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.2)), ${designLanguage.colors.red[300]}`,
    },
    icon: {
      foreground: uiColors.foreground,
    },
    // switch: {
    //   backgroundOff: uiColors.input.background,
    //   backgroundOn: uiColors.button.background,
    //   toggle: designLanguage.colors.white,
    // },
    dialog: {
      background: uiColors.quickInput.background,
      foreground: uiColors.quickInput.foreground,
      border: uiColors.sideBar.border,
    },
    menuList: {
      background: uiColors.sideBar.background,
      // foreground: uiColors.mutedForeground,
      border: uiColors.sideBar.border,
      hoverBackground: uiColors.sideBar.border,
      hoverForeground: designLanguage.colors.white,
    },
  };

  uiColors = deepmerge(uiColors, addedColors);

  // if (uiColors.switch.backgroundOff === uiColors.sideBar.background) {
  //   uiColors.switch.backgroundOff = uiColors.sideBar.border;
  // }

  // if (uiColors.switch.toggle === uiColors.switch.backgroundOff) {
  //   // default is white, we make it a little darker
  //   uiColors.switch.toggle = designLanguage.colors.gray[200];
  // }

  // // ensure enough contrast from inactive state
  uiColors.activityBar.selectedForeground = withContrast(
    uiColors.activityBar.selectedForeground,
    uiColors.activityBar.inactiveForeground,
    type,
    'icon'
  );

  const colors = {};

  Object.keys(uiColors).forEach((c) => {
    if (typeof uiColors[c] === 'object') {
      Object.keys(uiColors[c]).forEach((d) => {
        colors[`${c}.${d}`] = uiColors[c][d];
      });
    } else {
      colors[`${c}`] = uiColors[c];
    }
  });

  return colors;
};

export default polyfillTheme;

const guessType = (theme) => {
  if (theme.name && theme.name.toLowerCase().includes('light')) return 'light';
  return Color(theme.colors['editor.background']).isLight() ? 'light' : 'dark';
};

const lighten = (color, value) => Color(color).lighten(value).hex();

const shades = (color) => {
  let old = [];

  const hsl = Color(color).hsl();
  const isLight = hsl.isLight();

  console.log({ isLight });

  for (var i = 0; i < 10.1; i = i + 0.5) {
    old.push([
      (isLight ? i : 10 - i) * 100,
      hsl
        .lightness(i * 10)
        .hex()
        .toString(),
    ]);
  }

  return Object.fromEntries(old);
};

const darken = (color, value) => Color(color).darken(value).hex();

const withContrast = (color, background, type, contrastType = 'text') => {
  const contrastRatio = { text: 4.5, icon: 1.6 };
  const contrast = contrastRatio[contrastType];

  if (Color(color).contrast(Color(background)) > contrast) return color;

  // can't fix that
  if (color === '#FFFFFF' || color === '#000000') return color;

  // recursively increase contrast
  const increaseContrast = type === 'dark' ? lighten : darken;
  return withContrast(
    increaseContrast(color, 0.1),
    background,
    type,
    contrastType
  );
};
