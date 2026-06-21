import 'package:flutter/material.dart';

@immutable
class AppRadius extends ThemeExtension<AppRadius> {
  final double xs;
  final double sm;
  final double md;
  final double lg;
  final double xl;
  final double xxl;
  final double full;

  const AppRadius({
    required this.xs,
    required this.sm,
    required this.md,
    required this.lg,
    required this.xl,
    required this.xxl,
    required this.full,
  });

  BorderRadius get xsBorderRadius => BorderRadius.circular(xs);
  BorderRadius get smBorderRadius => BorderRadius.circular(sm);
  BorderRadius get mdBorderRadius => BorderRadius.circular(md);
  BorderRadius get lgBorderRadius => BorderRadius.circular(lg);
  BorderRadius get xlBorderRadius => BorderRadius.circular(xl);
  BorderRadius get xxlBorderRadius => BorderRadius.circular(xxl);
  BorderRadius get fullBorderRadius => BorderRadius.circular(full);

  @override
  ThemeExtension<AppRadius> copyWith({
    double? xs,
    double? sm,
    double? md,
    double? lg,
    double? xl,
    double? xxl,
    double? full,
  }) {
    return AppRadius(
      xs: xs ?? this.xs,
      sm: sm ?? this.sm,
      md: md ?? this.md,
      lg: lg ?? this.lg,
      xl: xl ?? this.xl,
      xxl: xxl ?? this.xxl,
      full: full ?? this.full,
    );
  }

  @override
  ThemeExtension<AppRadius> lerp(ThemeExtension<AppRadius>? other, double t) {
    if (other is! AppRadius) return this;
    return AppRadius(
      xs: (xs + (other.xs - xs) * t),
      sm: (sm + (other.sm - sm) * t),
      md: (md + (other.md - md) * t),
      lg: (lg + (other.lg - lg) * t),
      xl: (xl + (other.xl - xl) * t),
      xxl: (xxl + (other.xxl - xxl) * t),
      full: (full + (other.full - full) * t),
    );
  }
}

const appRadius = AppRadius(
  xs: 4.0,
  sm: 8.0,
  md: 12.0,
  lg: 16.0,
  xl: 20.0,
  xxl: 24.0,
  full: 9999.0,
);
