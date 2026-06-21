import 'package:flutter/material.dart';
import 'package:flutter_pos/shared/widgets/app_button.dart';

class AppEmptyState extends StatelessWidget {
  final IconData? icon;
  final String? title;
  final String? description;
  final String? actionLabel;
  final VoidCallback? onAction;

  const AppEmptyState({
    super.key,
    this.icon = Icons.inbox_outlined,
    this.title = "No Data Found",
    this.description = "There's nothing here yet",
    this.actionLabel,
    this.onAction,
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
            color: Theme.of(context).colorScheme.outline,
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
          if (actionLabel != null && onAction != null) ...[
            const SizedBox(height: 32),
            AppButton(
              text: actionLabel,
              onPressed: onAction,
            ),
          ],
        ],
      ),
    );
  }
}
