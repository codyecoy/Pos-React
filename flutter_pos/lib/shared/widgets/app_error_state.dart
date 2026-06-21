import 'package:flutter/material.dart';
import 'package:flutter_pos/shared/widgets/app_button.dart';

class AppErrorState extends StatelessWidget {
  final IconData? icon;
  final String? title;
  final String? description;
  final String? actionLabel;
  final VoidCallback? onRetry;

  AppErrorState({
    super.key,
    this.icon = Icons.error_outline,
    this.title = "Something went wrong",
    this.description,
    this.actionLabel = "Try again",
    this.onRetry,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Icon(
            icon,
            size: 80,
            color: Theme.of(context).colorScheme.error,
          ),
          const SizedBox(height: 24),
          Text(
            title!,
            style: Theme.of(context).textTheme.headlineSmall,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          if (description != null)
            Text(
              description!,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
              textAlign: TextAlign.center,
            ),
          const SizedBox(height: 32),
          if (onRetry != null)
            AppButton(
            text: actionLabel,
            onPressed: onRetry,
            variant: AppButtonVariant.primary,
          ),
        ],
      ),
    );
  }
}
