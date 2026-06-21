import 'package:flutter/material.dart';
import 'package:flutter_pos/core/theme/app_radius.dart';

enum AppInputVariant {
  filled,
  outlined,
  underlined,
}

class AppInput extends StatefulWidget {
  final TextEditingController? controller;
  final String? labelText;
  final String? hintText;
  final String? helperText;
  final String? errorText;
  final AppInputVariant variant;
  final bool obscureText;
  final bool enabled;
  final Widget? prefixIcon;
  final Widget? suffixIcon;
  final TextInputType? keyboardType;
  final TextInputAction? textInputAction;
  final int? maxLines;
  final int? minLines;
  final int? maxLength;
  final ValueChanged<String>? onChanged;
  final ValueChanged<String>? onFieldSubmitted;
  final FormFieldSetter<String>? onSaved;
  final FormFieldValidator<String>? validator;
  final AutovalidateMode? autovalidateMode;
  final List<String>? autofillHints;
  final FocusNode? focusNode;
  final TextStyle? style;
  final InputDecoration? decoration;
  final bool? expands;
  final bool readOnly;
  final VoidCallback? onTap;
  final Iterable<String>? autofocusHints;

  const AppInput({
    super.key,
    this.controller,
    this.labelText,
    this.hintText,
    this.helperText,
    this.errorText,
    this.variant = AppInputVariant.filled,
    this.obscureText = false,
    this.enabled = true,
    this.prefixIcon,
    this.suffixIcon,
    this.keyboardType,
    this.textInputAction,
    this.maxLines = 1,
    this.minLines,
    this.maxLength,
    this.onChanged,
    this.onFieldSubmitted,
    this.onSaved,
    this.validator,
    this.autovalidateMode,
    this.autofillHints,
    this.focusNode,
    this.style,
    this.decoration,
    this.expands,
    this.readOnly = false,
    this.onTap,
    this.autofocusHints,
  });

  @override
  State<AppInput> createState() => _AppInputState();
}

class _AppInputState extends State<AppInput> {
  bool _isObscured = false;

  @override
  void initState() {
    super.initState();
    _isObscured = widget.obscureText;
  }

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).extension!;
    final radius = Theme.of(context).extension<AppRadius>()!;
    final colorScheme = Theme.of(context).colorScheme;

    return TextFormField(
      controller: widget.controller,
      obscureText: _isObscured,
      enabled: widget.enabled,
      keyboardType: widget.keyboardType,
      textInputAction: widget.textInputAction,
      maxLines: widget.maxLines,
      minLines: widget.minLines,
      maxLength: widget.maxLength,
      onChanged: widget.onChanged,
      onFieldSubmitted: widget.onFieldSubmitted,
      onSaved: widget.onSaved,
      validator: widget.validator,
      autovalidateMode: widget.autovalidateMode,
      autofillHints: widget.autofillHints,
      focusNode: widget.focusNode,
      style: widget.style,
      expands: widget.expands ?? false,
      readOnly: widget.readOnly,
      onTap: widget.onTap,
      decoration: widget.decoration ?? _buildDecoration(colorScheme, radius),
    );
  }

  InputDecoration _buildDecoration(ColorScheme colorScheme, AppRadius radius) {
    final border = OutlineInputBorder(
      borderRadius: radius.mdBorderRadius,
      borderSide: BorderSide(
        color: widget.errorText != null
            ? colorScheme.error
            : colorScheme.outline,
        width: 1,
      ),
    );

    final enabledBorder = OutlineInputBorder(
      borderRadius: radius.mdBorderRadius,
      borderSide: BorderSide(
        color: colorScheme.outline,
        width: 1,
      ),
    );

    final focusedBorder = OutlineInputBorder(
      borderRadius: radius.mdBorderRadius,
      borderSide: BorderSide(
        color: colorScheme.primary,
        width: 2,
      ),
    );

    final errorBorder = OutlineInputBorder(
      borderRadius: radius.mdBorderRadius,
      borderSide: BorderSide(
        color: colorScheme.error,
        width: 1,
      ),
    );

    final focusedErrorBorder = OutlineInputBorder(
      borderRadius: radius.mdBorderRadius,
      borderSide: BorderSide(
        color: colorScheme.error,
        width: 2,
      ),
    );

    final disabledBorder = OutlineInputBorder(
      borderRadius: radius.mdBorderRadius,
      borderSide: BorderSide(
        color: colorScheme.outlineVariant,
        width: 1,
      ),
    );

    InputDecoration decoration;

    switch (widget.variant) {
      case AppInputVariant.filled:
        decoration = InputDecoration(
          labelText: widget.labelText,
          hintText: widget.hintText,
          helperText: widget.helperText,
          errorText: widget.errorText,
          prefixIcon: widget.prefixIcon,
          suffixIcon: widget.obscureText
              ? IconButton(
                  icon: Icon(
                    _isObscured ? Icons.visibility_off : Icons.visibility,
                  ),
                  onPressed: () {
                    setState(() {
                      _isObscured = !_isObscured;
                    });
                  },
                )
              : widget.suffixIcon,
          filled: true,
          fillColor: widget.enabled
              ? colorScheme.surfaceContainer
              : colorScheme.surfaceContainerHighest,
          border: border,
          enabledBorder: enabledBorder,
          focusedBorder: focusedBorder,
          errorBorder: errorBorder,
          focusedErrorBorder: focusedErrorBorder,
          disabledBorder: disabledBorder,
        );
        break;
      case AppInputVariant.outlined:
        decoration = InputDecoration(
          labelText: widget.labelText,
          hintText: widget.hintText,
          helperText: widget.helperText,
          errorText: widget.errorText,
          prefixIcon: widget.prefixIcon,
          suffixIcon: widget.obscureText
              ? IconButton(
                  icon: Icon(
                    _isObscured ? Icons.visibility_off : Icons.visibility,
                  ),
                  onPressed: () {
                    setState(() {
                      _isObscured = !_isObscured;
                    });
                  },
                )
              : widget.suffixIcon,
          filled: false,
          border: border,
          enabledBorder: enabledBorder,
          focusedBorder: focusedBorder,
          errorBorder: errorBorder,
          focusedErrorBorder: focusedErrorBorder,
          disabledBorder: disabledBorder,
        );
        break;
      case AppInputVariant.underlined:
        decoration = InputDecoration(
          labelText: widget.labelText,
          hintText: widget.hintText,
          helperText: widget.helperText,
          errorText: widget.errorText,
          prefixIcon: widget.prefixIcon,
          suffixIcon: widget.obscureText
              ? IconButton(
                  icon: Icon(
                    _isObscured ? Icons.visibility_off : Icons.visibility,
                  ),
                  onPressed: () {
                    setState(() {
                      _isObscured = !_isObscured;
                    });
                  },
                )
              : widget.suffixIcon,
          border: const UnderlineInputBorder(),
        );
        break;
    }

    return decoration;
  }
}
