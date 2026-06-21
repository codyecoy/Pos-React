import 'package:flutter/material.dart';
import 'package:flutter_pos/core/theme/app_radius.dart';

enum AppCardVariant {
  elevated,
  filled,
  outlined,
  plain,
}

class AppCard extends StatelessWidget {
  final AppCardVariant variant;
  final Widget child;
  final double? elevation;
  final EdgeInsets? padding;
  final EdgeInsets? margin;
  final VoidCallback? onTap;
  final Color? backgroundColor;
  final Color? borderColor;
  final BorderRadius? borderRadius;
  final bool ignorePointer;

  const AppCard({
    super.key,
    this.variant = AppCardVariant.filled,
    required this.child,
    this.elevation,
    this.padding,
    this.margin,
    this.onTap,
    this.backgroundColor,
    this.borderColor,
    this.borderRadius,
    this.ignorePointer = false,
  });

  @override
  Widget build(BuildContext context) {
    final radius = Theme.of(context).extension<AppRadius>()!;
    final defaultBorderRadius = borderRadius ?? radius.lgBorderRadius;
    final defaultPadding = padding ?? const EdgeInsets.all(20);

    Widget content = Padding(
      padding: defaultPadding,
      child: child,
    );

    if (onTap != null) {
      content = InkWell(
        onTap: onTap,
        borderRadius: defaultBorderRadius,
        child: content,
      );
    }

    if (ignorePointer) {
      content = IgnorePointer(child: content);
    }

    return Container(
      margin: margin,
      decoration: _getDecoration(context, radius, defaultBorderRadius),
      child: Material(
        color: Colors.transparent,
        borderRadius: defaultBorderRadius,
        child: content,
      ),
    );
  }

  Decoration _getDecoration(
    BuildContext context,
    AppRadius radius,
    BorderRadiusGeometry defaultBorderRadius,
  ) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    switch (variant) {
      case AppCardVariant.elevated:
        return BoxDecoration(
          color: backgroundColor ?? colorScheme.surface,
          borderRadius: defaultBorderRadius,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.08),
              blurRadius: elevation ?? 24,
              offset: const Offset(0, 4),
            ),
          ],
        );
      case AppCardVariant.filled:
        return BoxDecoration(
          color: backgroundColor ?? colorScheme.surface,
          borderRadius: defaultBorderRadius,
          border: Border.all(
            color: borderColor ?? colorScheme.outlineVariant,
            width: 1,
          ),
        );
      case AppCardVariant.outlined:
        return BoxDecoration(
          color: Colors.transparent,
          borderRadius: defaultBorderRadius,
          border: Border.all(
            color: borderColor ?? colorScheme.outline,
            width: 1,
          ),
        );
      case AppCardVariant.plain:
        return BoxDecoration(
          color: Colors.transparent,
          borderRadius: defaultBorderRadius,
        );
    }
  }
}
