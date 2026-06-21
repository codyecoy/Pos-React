import 'package:flutter/material.dart';

@immutable
class AppColors extends ThemeExtension<AppColors> {
  // Primary Colors
  final Color primary;
  final Color onPrimary;
  final Color primaryContainer;
  final Color onPrimaryContainer;

  // Secondary Colors
  final Color secondary;
  final Color onSecondary;
  final Color secondaryContainer;
  final Color onSecondaryContainer;

  // Accent Colors
  final Color accent;
  final Color onAccent;

  // Status Colors
  final Color success;
  final Color onSuccess;
  final Color warning;
  final Color onWarning;
  final Color danger;
  final Color onDanger;

  // Background & Surface
  final Color background;
  final Color onBackground;
  final Color surface;
  final Color onSurface;
  final Color surfaceVariant;
  final Color onSurfaceVariant;
  final Color outline;
  final Color outlineVariant;
  final Color scrim;
  final Color shadow;
  final Color surfaceTint;

  const AppColors({
    required this.primary,
    required this.onPrimary,
    required this.primaryContainer,
    required this.onPrimaryContainer,
    required this.secondary,
    required this.onSecondary,
    required this.secondaryContainer,
    required this.onSecondaryContainer,
    required this.accent,
    required this.onAccent,
    required this.success,
    required this.onSuccess,
    required this.warning,
    required this.onWarning,
    required this.danger,
    required this.onDanger,
    required this.background,
    required this.onBackground,
    required this.surface,
    required this.onSurface,
    required this.surfaceVariant,
    required this.onSurfaceVariant,
    required this.outline,
    required this.outlineVariant,
    required this.scrim,
    required this.shadow,
    required this.surfaceTint,
  });

  @override
  ThemeExtension<AppColors> copyWith({
    Color? primary,
    Color? onPrimary,
    Color? primaryContainer,
    Color? onPrimaryContainer,
    Color? secondary,
    Color? onSecondary,
    Color? secondaryContainer,
    Color? onSecondaryContainer,
    Color? accent,
    Color? onAccent,
    Color? success,
    Color? onSuccess,
    Color? warning,
    Color? onWarning,
    Color? danger,
    Color? onDanger,
    Color? background,
    Color? onBackground,
    Color? surface,
    Color? onSurface,
    Color? surfaceVariant,
    Color? onSurfaceVariant,
    Color? outline,
    Color? outlineVariant,
    Color? scrim,
    Color? shadow,
    Color? surfaceTint,
  }) {
    return AppColors(
      primary: primary ?? this.primary,
      onPrimary: onPrimary ?? this.onPrimary,
      primaryContainer: primaryContainer ?? this.primaryContainer,
      onPrimaryContainer: onPrimaryContainer ?? this.onPrimaryContainer,
      secondary: secondary ?? this.secondary,
      onSecondary: onSecondary ?? this.onSecondary,
      secondaryContainer: secondaryContainer ?? this.secondaryContainer,
      onSecondaryContainer: onSecondaryContainer ?? this.onSecondaryContainer,
      accent: accent ?? this.accent,
      onAccent: onAccent ?? this.onAccent,
      success: success ?? this.success,
      onSuccess: onSuccess ?? this.onSuccess,
      warning: warning ?? this.warning,
      onWarning: onWarning ?? this.onWarning,
      danger: danger ?? this.danger,
      onDanger: onDanger ?? this.onDanger,
      background: background ?? this.background,
      onBackground: onBackground ?? this.onBackground,
      surface: surface ?? this.surface,
      onSurface: onSurface ?? this.onSurface,
      surfaceVariant: surfaceVariant ?? this.surfaceVariant,
      onSurfaceVariant: onSurfaceVariant ?? this.onSurfaceVariant,
      outline: outline ?? this.outline,
      outlineVariant: outlineVariant ?? this.outlineVariant,
      scrim: scrim ?? this.scrim,
      shadow: shadow ?? this.shadow,
      surfaceTint: surfaceTint ?? this.surfaceTint,
    );
  }

  @override
  ThemeExtension<AppColors> lerp(ThemeExtension<AppColors>? other, double t) {
    if (other is! AppColors) return this;
    return AppColors(
      primary: Color.lerp(primary, other.primary, t)!,
      onPrimary: Color.lerp(onPrimary, other.onPrimary, t)!,
      primaryContainer: Color.lerp(primaryContainer, other.primaryContainer, t)!,
      onPrimaryContainer: Color.lerp(onPrimaryContainer, other.onPrimaryContainer, t)!,
      secondary: Color.lerp(secondary, other.secondary, t)!,
      onSecondary: Color.lerp(onSecondary, other.onSecondary, t)!,
      secondaryContainer: Color.lerp(secondaryContainer, other.secondaryContainer, t)!,
      onSecondaryContainer: Color.lerp(onSecondaryContainer, other.onSecondaryContainer, t)!,
      accent: Color.lerp(accent, other.accent, t)!,
      onAccent: Color.lerp(onAccent, other.onAccent, t)!,
      success: Color.lerp(success, other.success, t)!,
      onSuccess: Color.lerp(onSuccess, other.onSuccess, t)!,
      warning: Color.lerp(warning, other.warning, t)!,
      onWarning: Color.lerp(onWarning, other.onWarning, t)!,
      danger: Color.lerp(danger, other.danger, t)!,
      onDanger: Color.lerp(onDanger, other.onDanger, t)!,
      background: Color.lerp(background, other.background, t)!,
      onBackground: Color.lerp(onBackground, other.onBackground, t)!,
      surface: Color.lerp(surface, other.surface, t)!,
      onSurface: Color.lerp(onSurface, other.onSurface, t)!,
      surfaceVariant: Color.lerp(surfaceVariant, other.surfaceVariant, t)!,
      onSurfaceVariant: Color.lerp(onSurfaceVariant, other.onSurfaceVariant, t)!,
      outline: Color.lerp(outline, other.outline, t)!,
      outlineVariant: Color.lerp(outlineVariant, other.outlineVariant, t)!,
      scrim: Color.lerp(scrim, other.scrim, t)!,
      shadow: Color.lerp(shadow, other.shadow, t)!,
      surfaceTint: Color.lerp(surfaceTint, other.surfaceTint, t)!,
    );
  }
}

// Light theme colors
const lightAppColors = AppColors(
  primary: Color(0xFF6366F1),
  onPrimary: Color(0xFFFFFFFF),
  primaryContainer: Color(0xFFEEF2FF),
  onPrimaryContainer: Color(0xFF1E1B4B),
  secondary: Color(0xFF8B5CF6),
  onSecondary: Color(0xFFFFFFFF),
  secondaryContainer: Color(0xFFEDE9FE),
  onSecondaryContainer: Color(0xFF1E1B4B),
  accent: Color(0xFF06B6D4),
  onAccent: Color(0xFFFFFFFF),
  success: Color(0xFF10B981),
  onSuccess: Color(0xFFFFFFFF),
  warning: Color(0xFFF59E0B),
  onWarning: Color(0xFFFFFFFF),
  danger: Color(0xFFEF4444),
  onDanger: Color(0xFFFFFFFF),
  background: Color(0xFFF8FAFC),
  onBackground: Color(0xFF0F172A),
  surface: Color(0xFFFFFFFF),
  onSurface: Color(0xFF0F172A),
  surfaceVariant: Color(0xFFF1F5F9),
  onSurfaceVariant: Color(0xFF475569),
  outline: Color(0xFFCBD5E1),
  outlineVariant: Color(0xFFE2E8F0),
  scrim: Color(0xFF000000),
  shadow: Color(0x1E000000),
  surfaceTint: Color(0xFF6366F1),
);

// Dark theme colors
const darkAppColors = AppColors(
  primary: Color(0xFF818CF8),
  onPrimary: Color(0xFF1E1B4B),
  primaryContainer: Color(0xFF312E81),
  onPrimaryContainer: Color(0xFFE0E7FF),
  secondary: Color(0xFFA78BFA),
  onSecondary: Color(0xFF1E1B4B),
  secondaryContainer: Color(0xFF4C1D95),
  onSecondaryContainer: Color(0xFFEDE9FE),
  accent: Color(0xFF22D3EE),
  onAccent: Color(0xFF083344),
  success: Color(0xFF34D399),
  onSuccess: Color(0xFF022C22),
  warning: Color(0xFFFBBF24),
  onWarning: Color(0xFF111827),
  danger: Color(0xFFF87171),
  onDanger: Color(0xFF450A0A),
  background: Color(0xFF0F172A),
  onBackground: Color(0xFFF8FAFC),
  surface: Color(0xFF1E293B),
  onSurface: Color(0xFFF8FAFC),
  surfaceVariant: Color(0xFF334155),
  onSurfaceVariant: Color(0xFF94A3B8),
  outline: Color(0xFF475569),
  outlineVariant: Color(0xFF334155),
  scrim: Color(0xFF000000),
  shadow: Color(0x4C000000),
  surfaceTint: Color(0xFF818CF8),
);
