# POS Flutter Mobile App

Mobile version of the POS React application built with Flutter.

## Features Mapping

| React Feature | Flutter Screen |
|---------------|----------------|
| LoginPage | LoginPage |
| CashierPage | CashierPage (with responsive mobile/tablet layouts) |
| DashboardPage | DashboardPage |
| ProductsPage | ProductsPage |
| CustomersPage | CustomersPage |
| ReportsPage | ReportsPage |
| SuppliersPage | SuppliersPage |
| PurchasingPage | PurchasingPage |
| DebtsPage | DebtsPage |
| SettingsPage | SettingsPage |

## Tech Stack

- **Flutter**: Latest stable version
- **State Management**: Flutter Riverpod
- **Navigation**: Go Router
- **API Client**: Dio
- **Code Generation**: Freezed, Json Serializable

## Project Structure

```
lib/
├── main.dart
├── core/
│   ├── constants/
│   │   └── app_constants.dart
│   ├── router/
│   │   └── app_router.dart
│   ├── services/
│   │   ├── api_client.dart
│   │   ├── auth_api.dart
│   │   ├── product_api.dart
│   │   ├── category_api.dart
│   │   ├── transaction_api.dart
│   │   └── customer_api.dart
│   ├── theme/
│   │   └── app_theme.dart
│   └── utils/
│       └── responsive_layout.dart
└── features/
    ├── auth/
    │   ├── data/
    │   │   ├── models/
    │   │   │   └── user_model.dart
    │   │   └── repositories/
    │   │       └── auth_repository.dart
    │   └── presentation/
    │       ├── pages/
    │       │   └── login_page.dart
    │       └── providers/
    │           └── auth_provider.dart
    ├── cashier/
    │   └── presentation/
    │       ├── pages/
    │       │   └── cashier_page.dart
    │       └── providers/
    │           └── cart_provider.dart
    ├── products/
    │   ├── data/
    │   │   └── models/
    │   │       ├── product_model.dart
    │   │       └── category_model.dart
    │   └── presentation/
    │       ├── pages/
    │       │   └── products_page.dart
    │       └── providers/
    │           └── products_provider.dart
    ├── customers/
    │   ├── data/
    │   │   └── models/
    │   │       └── customer_model.dart
    │   └── presentation/
    │       └── pages/
    │           └── customers_page.dart
    ├── transactions/
    │   └── data/
    │       └── models/
    │           └── transaction_model.dart
    └── [other features]/
```

## Getting Started

1. **Initialize Flutter Project**
   ```bash
   cd flutter_pos
   flutter pub get
   ```

2. **Generate Code**
   ```bash
   dart run build_runner build --delete-conflicting-outputs
   ```

3. **Run the App**
   ```bash
   flutter run
   ```

## Responsive Design

The app supports two layouts:
- **Mobile**: For screens < 600dp
- **Tablet**: For screens ≥ 600dp (with split view for POS)

## API Integration

All API endpoints are the same as the React app:
- `/auth/login` - User authentication
- `/products` - Product management
- `/categories` - Category management
- `/transactions` - Transaction management
- `/customers` - Customer management
