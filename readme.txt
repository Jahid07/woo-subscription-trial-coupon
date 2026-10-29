=== Free Trial Coupon for WooCommerce Subscriptions ===
Contributors: md-jahidul-islam
Tags: woocommerce, subscriptions, free trial, coupons, trial period
Requires at least: 5.9
Tested up to: 7.1
Stable tag: 2.0.2
Requires PHP: 7.0.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Offer custom free-trial periods for WooCommerce subscription products with trial coupons and optional sign-up fee discounts.

== Description ==

Free Trial Coupon for WooCommerce Subscriptions lets you offer a different free-trial period through a coupon code. Create a "Subscription Trial" coupon, choose the trial length and period, and let customers apply it when signing up for a subscription.

Use trial coupons for subscription promotions, introductory offers, and extended trials. You can also add a trial period to WooCommerce Subscriptions' fixed or percentage sign-up fee discount coupons.

= Features =

* A dedicated "Subscription Trial" coupon type.
* Set the free-trial length in days, weeks, months, or years.
* Add trial settings to "Sign-Up Fee Discount" and "Sign-Up Fee % Discount" coupons.
* Trial handling for simple subscriptions and subscription variations.
* Display the coupon's trial period in cart totals.
* Reject trial-only coupons when the cart contains no subscription products.

Trial-only coupons do not discount sign-up fees. This plugin does not add renewal-payment discounts.

= Requirements =

Install and activate both:

1. [WooCommerce 6.5 or greater](https://wordpress.org/plugins/woocommerce/).
2. [WooCommerce Subscriptions 6.7 or greater](https://woocommerce.com/products/woocommerce-subscriptions/) (paid extension, purchased separately).

These are the existing minimum requirements; they are not a claim that every version combination has been tested.

= Compatibility and community testing =

Version 2.0.2 was tested with WordPress 7.1.4, WooCommerce 11.2.1, WooCommerce Subscriptions 7.7.0, and PHP 8.3.32. Verified scenarios include a seven-day trial on a simple subscription using the classic cart and checkout, coupon refresh/removal/reapplication, and rejection on a regular-product cart.

We do not currently have access to the latest WooCommerce Subscriptions release, so compatibility with that release has not yet been verified. If you have a newer version and would like to contribute, please test the release candidate on a staging site and [share your versions, steps, and results on GitHub](https://github.com/Jahid07/woo-subscription-trial-coupon/issues). Please do not upload paid plugin files, license keys, or customer data.

[Testing details and known coverage limits](https://github.com/Jahid07/woo-subscription-trial-coupon/blob/master/docs/testing.md) are maintained in the development repository. Automatic payment gateways, renewals, block checkout, subscription variations, and sign-up fee coupon combinations are not covered by the latest release checks.

= Getting started =

1. Go to **Marketing > Coupons** and add a coupon.
2. Choose **Subscription Trial** as the discount type.
3. Enter the **Free trial** length and select its period.
4. Set any coupon restrictions and publish the coupon.
5. Add a subscription product to the cart and apply the code. Review the trial and recurring totals before placing an order.

= Demo =

[Explore the demo store](https://demo.coderplus.co/woo-subscription-trial-coupon/). Example coupon codes on that site:

* `TRIALDESIGN`: one-month trial for the graphic design subscription.
* `TRIALSUPPORT`: five-day trial for the tech support subscription.
* `TRIALMEDITATE`: two-week trial for weekly meditation classes.
* `TRIALBOOK`: one-year trial for the virtual book club.
* `TRIALLANG`: percentage sign-up fee discount for online language lessons.
* `TRIALSEO`: fixed sign-up fee discount for monthly SEO audit reports.

These are demo codes; create your own coupons on your store.

= Other plugins by CoderPlus =

**Data Privacy Manager for WooCommerce (Premium)**
Help your team process customer privacy requests associated with GDPR workflows, review approvals, follow up with customers, and track outcomes. Organize permission records, privacy choices, staff access, and customer-facing steps.
[View on WooCommerce.com](https://woocommerce.com/products/data-privacy-manager/)

**Role-Based Analytics for WooCommerce (Premium)**
Filter WooCommerce Analytics by WordPress user role. Compare customer groups across sales, orders, products, coupon usage, and downloads, with role reports and leaderboards.
[View on WooCommerce.com](https://woocommerce.com/products/role-based-analytics-woocommerce/)

**X Scroll To Top - Responsive**
Add a lightweight, customizable scroll-to-top button to your site.
[View on WordPress.org](https://wordpress.org/plugins/x-scroll-to-top-responsive/)

**Logo Switcher for Divi**
Set a separate logo for Divi's fixed navigation header when visitors scroll.
[View on WordPress.org](https://wordpress.org/plugins/logo-switcher-divi/)

== Installation ==

1. Install and activate WooCommerce and WooCommerce Subscriptions.
2. Go to **Plugins > Add New** and search for **Free Trial Coupon for WooCommerce Subscriptions**, then install and activate it. Alternatively, upload the plugin ZIP using **Plugins > Add New > Upload Plugin**.
3. Go to **Marketing > Coupons** to create a trial coupon.

For manual installation, extract the ZIP and upload the `woo-subscription-trial-coupon` folder to `/wp-content/plugins/`, then activate it from **Plugins**.

== Frequently Asked Questions ==

= Does it work without WooCommerce Subscriptions? =

No. Both WooCommerce and the paid WooCommerce Subscriptions extension must be installed and activated.

= How do I offer a different trial period with a coupon? =

Create a "Subscription Trial" coupon, enter the trial length and period, and publish it. Customers apply the code in the cart or checkout when signing up for an eligible subscription.

= Can I combine a trial with a sign-up fee discount? =

The plugin adds trial fields to WooCommerce Subscriptions' fixed and percentage sign-up fee discount coupon types. Test your product and coupon combination on staging before using it in your store.

= Does it discount subscription renewals? =

No. The plugin focuses on the initial trial period and sign-up fee coupon settings; it does not add renewal discounts.

= Have you tested the latest WooCommerce Subscriptions release? =

Our available test copy is version 7.7.0. We welcome staging-test reports from users with newer versions. See the compatibility section above for the exact tested stack and contribution link.

== Screenshots ==

1. Open Marketing > Coupons in the WordPress dashboard.
2. Create a new coupon.
3. Select the "Subscription Trial" coupon type.
4. Enter the free-trial length and period.
5. Cart totals before applying the coupon.
6. Cart totals after applying the coupon.

== Changelog ==

= 2.0.2 =
* Fix a PHP deprecation when a trial coupon is rejected for a cart without subscription products.
* Clear obsolete validation errors when the same coupon is checked again after the cart changes.
* Tested with WordPress 7.1.4 and WooCommerce 11.2.1 using WooCommerce Subscriptions 7.7.0.
* Clarify setup instructions, compatibility coverage, and community testing information.

= 2.0.1 - September 24, 2024 =
- Improve code quality
= 2.0.0 - September 24, 2024 =
- Refactored codebase to Object-Oriented Programming (OOP) style for better maintainability and scalability.
- Restructured plugin files to follow modern WordPress standards, improving organization and clarity.
- Added full WordPress localization support, enabling translation into multiple languages.
- Improved security with proper escaping and sanitization throughout the plugin to prevent vulnerabilities.
- Enhanced language support, including text domain setup for easier translation and integration with WordPress language packs.
- Introduced support for WordPress Plugin Dependencies, ensuring required plugins are automatically detected and prompted for installation.
- Optimized performance with better handling of coupon-related actions and WooCommerce integrations.
= 1.0.1 - Octobor 26, 2019 =
- Improve code
= 1.0.0 - Octobor 25, 2019 =
- initial release

