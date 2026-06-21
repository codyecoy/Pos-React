import 'package:flutter/material.dart';
import 'package:flutter_pos/core/theme/app_colors.dart';
import 'package:flutter_pos/shared/widgets/app_card.dart';

enum StatCardVariant {
  regular,
  filled,
  outlined,
}

class StatCard extends StatelessWidget {
  final StatCardVariant variant;
  final Widget? icon;
  final IconData? iconData;
  final String title;
  final String value;
  final String? subtitle;
  final Color? backgroundColor;
  final Color? iconColor;
  final Color? valueColor;
  final Color? titleColor;
  final VoidCallback? onTap;
  final double? iconSize;
  final bool isPositive;
  final String? changeValue;

  const StatCard({
    super.key,
    this.variant = StatCardVariant.regular,
    this.icon,
    this.iconData,
    required this.title,
    required this.value,
    this.subtitle,
    this.backgroundColor,
    this.iconColor,
    this.valueColor,
    this.titleColor,
    this.onTap,
    this.iconSize = 28,
    this.isPositive = true,
    this.changeValue,
  });

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).extension<AppColors>()!;
    final colorScheme = Theme.of(context).colorScheme;

    final effectiveIconColor = iconColor ??
        (variant == StatCardVariant.filled
            ? colorScheme.onPrimary
            : colors.primary);
    final effectiveValueColor = valueColor ??
        (variant == StatCardVariant.filled
            ? colorScheme.onPrimary
            : colorScheme.onSurface);
    final effectiveTitleColor = titleColor ??
        (variant == StatCardVariant.filled
            ? colorScheme.onPrimary.withValues(alpha: 0.8)
            : colorScheme.onSurfaceVariant);
    final effectiveBackgroundColor = backgroundColor ??
        (variant == StatCardVariant.filled
            ? colors.primary
            : Colors.transparent);

    return AppCard(
      variant: variant == StatCardVariant.filled
          ? AppCardVariant.filled
          : variant == StatCardVariant.outlined
              ? AppCardVariant.outlined
              : AppCardVariant.filled,
      backgroundColor: effectiveBackgroundColor,
      borderColor: colors.outlineVariant,
      onTap: onTap,
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style:
                          Theme.of(context).textTheme.titleSmall?.copyWith(
                                color: effectiveTitleColor,
                                fontWeight: FontWeight.w500,
                              ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      value,
                      style: Theme.of(context)
                          .textTheme
                          .headlineMedium
                          ?.copyWith(
                            color: effectiveValueColor,
                            fontWeight: FontWeight.w700,
                            height: 1.1,
                          ),
                    ),
                  ],
                ),
              ),
              if (icon != null || iconData != null)
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: variant == StatCardVariant.filled
                        ? colors.onPrimary.withValues(alpha: 0.15)
                        : colors.primaryContainer,
                    shape: BoxShape.circle,
                  ),
                  child: icon ??
                      Icon(
                        iconData,
                        color: effectiveIconColor,
                        size: iconSize,
                      ),
                ),
            ],
          ),
          if (subtitle != null || changeValue != null) ...[
            const SizedBox(height: 16),
            Row(
              children: [
                if (changeValue != null) ...[
                  Icon(
                    isPositive
                        ? Icons.arrow_upward_rounded
                        : Icons.arrow_downward_rounded,
                    color: variant == StatCardVariant.filled
                        ? colors.onPrimary.withValues(alpha: 0.9)
                        : isPositive
                            ? colors.success
                            : colors.danger,
                    size: 18,
                  ),
                  const SizedBox(width: 6),
                  Text(
                    changeValue!,
                    style: Theme.of(context).textTheme.labelMedium?.copyWith(
                          color: variant == StatCardVariant.filled
                              ? colors.onPrimary.withValues(alpha: 0.9)
                              : isPositive
                                  ? colors.success
                                  : colors.danger,
                          fontWeight: FontWeight.w600,
                        ),
                  ),
                ],
                if (subtitle != null)
                  Expanded(
                    child: Text(
                      subtitle!,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: variant == StatCardVariant.filled
                                ? colors.onPrimary.withValues(alpha: 0.7)
                                : colorScheme.onSurfaceVariant,
                          ),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}
