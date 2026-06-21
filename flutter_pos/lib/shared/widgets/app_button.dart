import 'package:flutter/material.dart';
import 'package:flutter_pos/core/theme/app_colors.dart';

enum AppButtonVariant {
  primary,
  secondary,
  tertiary,
  success,
  warning,
  danger,
  ghost,
}

enum AppButtonSize {
  xs,
  sm,
  md,
  lg,
  xl,
}

class AppButton extends StatelessWidget {
  final AppButtonVariant variant;
  final AppButtonSize size;
  final VoidCallback? onPressed;
  final Widget? child;
  final String? text;
  final IconData? icon;
  final bool isLoading;
  final bool fullWidth;
  final bool enabled;

  const AppButton({
    super.key,
    this.variant = AppButtonVariant.primary,
    this.size = AppButtonSize.md,
    this.onPressed,
    this.child,
    this.text,
    this.icon,
    this.isLoading = false,
    this.fullWidth = false,
    this.enabled = true,
  }) : assert(child != null || text != null);

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).extension<AppColors>()!;
    final isDisabled = isLoading || !enabled;
    return ElevatedButton(
      onPressed: isDisabled ? null : onPressed,
      style: _getButtonStyle(context, colors, isDisabled),
      child: isLoading
          ? SizedBox(
              width: _getIconSize(size),
              height: _getIconSize(size),
              child: CircularProgressIndicator(
                strokeWidth: 2,
                color: _getLoadingColor(colors),
              ),
            )
          : Row(
              mainAxisSize: MainAxisSize.min,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                if (icon != null) ...[
                  Icon(icon, size: _getIconSize(size)),
                  if (text != null || child != null) const SizedBox(width: 8),
                ],
                if (text != null)
                  Text(
                    text!,
                    style: _getTextStyle(context, size),
                  )
                else
                  child!,
              ],
            ),
    );
  }

  ButtonStyle _getButtonStyle(
    BuildContext context,
    AppColors colors,
    bool isDisabled,
  ) {
    final Color backgroundColor;
    final Color foregroundColor;
    final Color disabledBackgroundColor;
    final Color disabledForegroundColor;

    switch (variant) {
      case AppButtonVariant.primary:
        backgroundColor = colors.primary;
        foregroundColor = colors.onPrimary;
        disabledBackgroundColor = colors.primary.withValues(alpha: 0.5);
        disabledForegroundColor = colors.onPrimary.withValues(alpha: 0.7);
        break;
      case AppButtonVariant.secondary:
        backgroundColor = colors.secondary;
        foregroundColor = colors.onSecondary;
        disabledBackgroundColor = colors.secondary.withValues(alpha: 0.5);
        disabledForegroundColor = colors.onSecondary.withValues(alpha: 0.7);
        break;
      case AppButtonVariant.tertiary:
        backgroundColor = colors.accent;
        foregroundColor = colors.onAccent;
        disabledBackgroundColor = colors.accent.withValues(alpha: 0.5);
        disabledForegroundColor = colors.onAccent.withValues(alpha: 0.7);
        break;
      case AppButtonVariant.success:
        backgroundColor = colors.success;
        foregroundColor = colors.onSuccess;
        disabledBackgroundColor = colors.success.withValues(alpha: 0.5);
        disabledForegroundColor = colors.onSuccess.withValues(alpha: 0.7);
        break;
      case AppButtonVariant.warning:
        backgroundColor = colors.warning;
        foregroundColor = colors.onWarning;
        disabledBackgroundColor = colors.warning.withValues(alpha: 0.5);
        disabledForegroundColor = colors.onWarning.withValues(alpha: 0.7);
        break;
      case AppButtonVariant.danger:
        backgroundColor = colors.danger;
        foregroundColor = colors.onDanger;
        disabledBackgroundColor = colors.danger.withValues(alpha: 0.5);
        disabledForegroundColor = colors.onDanger.withValues(alpha: 0.7);
        break;
      case AppButtonVariant.ghost:
        backgroundColor = Colors.transparent;
        foregroundColor = colors.primary;
        disabledBackgroundColor = Colors.transparent;
        disabledForegroundColor = colors.outline;
        break;
    }

    final padding = _getPadding(size);
    final borderRadius = BorderRadius.circular(_getBorderRadius(size));

    return ElevatedButton.styleFrom(
      backgroundColor: isDisabled ? disabledBackgroundColor : backgroundColor,
      foregroundColor: isDisabled ? disabledForegroundColor : foregroundColor,
      padding: padding,
      shape: RoundedRectangleBorder(borderRadius: borderRadius),
      elevation: 0,
      minimumSize: fullWidth ? const Size(double.infinity, 0) : null,
      tapTargetSize: MaterialTapTargetSize.shrinkWrap,
    );
  }

  double _getBorderRadius(AppButtonSize size) {
    switch (size) {
      case AppButtonSize.xs:
        return 8;
      case AppButtonSize.sm:
        return 10;
      case AppButtonSize.md:
        return 14;
      case AppButtonSize.lg:
        return 16;
      case AppButtonSize.xl:
        return 20;
    }
  }

  double _getIconSize(AppButtonSize size) {
    switch (size) {
      case AppButtonSize.xs:
        return 16;
      case AppButtonSize.sm:
        return 18;
      case AppButtonSize.md:
        return 20;
      case AppButtonSize.lg:
        return 22;
      case AppButtonSize.xl:
        return 24;
    }
  }

  EdgeInsets _getPadding(AppButtonSize size) {
    switch (size) {
      case AppButtonSize.xs:
        return const EdgeInsets.symmetric(horizontal: 12, vertical: 6);
      case AppButtonSize.sm:
        return const EdgeInsets.symmetric(horizontal: 16, vertical: 8);
      case AppButtonSize.md:
        return const EdgeInsets.symmetric(horizontal: 20, vertical: 12);
      case AppButtonSize.lg:
        return const EdgeInsets.symmetric(horizontal: 24, vertical: 16);
      case AppButtonSize.xl:
        return const EdgeInsets.symmetric(horizontal: 32, vertical: 20);
    }
  }

  TextStyle _getTextStyle(BuildContext context, AppButtonSize size) {
    final TextStyle baseTextStyle;
    switch (size) {
      case AppButtonSize.xs:
        baseTextStyle = Theme.of(context).textTheme.labelSmall!;
        break;
      case AppButtonSize.sm:
        baseTextStyle = Theme.of(context).textTheme.labelMedium!;
        break;
      case AppButtonSize.md:
        baseTextStyle = Theme.of(context).textTheme.labelLarge!;
        break;
      case AppButtonSize.lg:
        baseTextStyle = Theme.of(context).textTheme.titleMedium!;
        break;
      case AppButtonSize.xl:
        baseTextStyle = Theme.of(context).textTheme.titleLarge!;
        break;
    }
    return baseTextStyle.copyWith(fontWeight: FontWeight.w600);
  }

  Color _getLoadingColor(AppColors colors) {
    switch (variant) {
      case AppButtonVariant.ghost:
        return colors.primary;
      default:
        return colors.onPrimary;
    }
  }
}
