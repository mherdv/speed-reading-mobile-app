import { colors } from './colors';

function relativeLuminance(hex: string): number {
  const channels = hex
    .slice(1)
    .match(/.{2}/g)
    ?.map((channel) => Number.parseInt(channel, 16) / 255)
    .map((channel) =>
      channel <= 0.04045
        ? channel / 12.92
        : ((channel + 0.055) / 1.055) ** 2.4
    );
  if (!channels || channels.length !== 3) {
    throw new Error(`Expected a six-digit color, received ${hex}`);
  }
  return (
    0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
  );
}

function contrastRatio(first: string, second: string): number {
  const firstLuminance = relativeLuminance(first);
  const secondLuminance = relativeLuminance(second);
  return (
    (Math.max(firstLuminance, secondLuminance) + 0.05) /
    (Math.min(firstLuminance, secondLuminance) + 0.05)
  );
}

describe('semantic color contrast', () => {
  it.each([
    ['enabled action', colors.onInteractive, colors.interactivePrimary],
    ['pressed action', colors.onInteractive, colors.interactivePrimaryPressed],
    ['teal action', colors.onInteractive, colors.interactiveTeal],
    ['warm action', colors.onInteractive, colors.interactiveWarm],
    ['info action', colors.onInteractive, colors.interactiveInfo],
    ['disabled', colors.disabledForeground, colors.disabledSurface],
    ['success', colors.successForeground, colors.successSurface],
    ['error', colors.errorForeground, colors.errorSurface],
    ['warning', colors.warningForeground, colors.warningSurface],
    ['information', colors.infoForeground, colors.infoSurface],
  ])('%s foreground meets WCAG AA for normal text', (_name, foreground, background) => {
    expect(contrastRatio(foreground, background)).toBeGreaterThanOrEqual(4.5);
  });

  it('keeps the focus indicator visible against the default card', () => {
    expect(contrastRatio(colors.focusRing, colors.cardBackground)).toBeGreaterThanOrEqual(
      3
    );
  });
});
