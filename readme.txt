=== Free Trial Coupon for WooCommerce Subscriptions ===
Contributors: md-jahidul-islam
Tags: woocommerce, subscriptions, free trial, coupons, trial period
Requires at least: 5.9
Tested up to: 7.1
Stable tag: 3.0.0
Requires PHP: 7.0.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Create free trial coupons for WooCommerce Subscriptions. Show trial periods, today’s payment, and recurring prices in classic and block checkout.

== Description ==

Free Trial Coupon for WooCommerce Subscriptions lets you offer a different free-trial period through a coupon code. Create a "Subscription Trial" coupon, choose the trial length and period, and let customers apply it when signing up for a subscription.

Help customers understand their subscription offer before they place an order. For supported trial coupons, the cart and checkout show the trial period, what is due today, the recurring price, and the first payment date. Works with classic cart and checkout pages and the WooCommerce Cart and Checkout blocks.

Use trial coupons for subscription promotions, introductory offers, and extended trials. You can also add a trial period to WooCommerce Subscriptions' fixed or percentage sign-up fee discount coupons.

= Features =

* A dedicated "Subscription Trial" coupon type.
* Set the free-trial length in days, weeks, months, or years.
* Add trial settings to "Sign-Up Fee Discount" and "Sign-Up Fee % Discount" coupons.
* Trial handling for simple subscriptions and subscription variations.
* Show the trial period with a clear green badge for supported trial coupons.
* Display today’s subscription payment alongside the recurring price.
* Compare first payment dates before and after the trial coupon.
* Support WooCommerce Cart and Checkout blocks as well as classic pages.
* Reject trial-only coupons when the cart contains no subscription products.

Trial-only coupons do not discount sign-up fees. This plugin does not add renewal-payment discounts.

= Requirements =

Install and activate both:

1. [WooCommerce 6.5 or greater](https://wordpress.org/plugins/woocommerce/).
2. [WooCommerce Subscriptions 6.7 or greater](https://woocommerce.com/products/woocommerce-subscriptions/) (paid extension, purchased separately).

= Compatibility and community testing =

Version 3.0.0 was checked with WooCommerce 11.2.1, WooCommerce Subscriptions 7.7.0, and PHP 8.3.32, using WordPress 7.1.3 for classic pages and WordPress 7.1.4 for Cart and Checkout blocks. Checks covered applying and removing a seven-day trial coupon, quantity changes, mixed carts, mobile checkout, and a local manual subscription checkout.

The enhanced price and date comparisons apply to a single Subscription Trial coupon on subscriptions without a sign-up fee or synchronized billing. Other combinations keep the standard WooCommerce Subscriptions display. A free trial does not necessarily make the entire order free: sign-up fees, other products, shipping, or taxes may still be payable.

Our available WooCommerce Subscriptions test copy is 7.7.0. If you have a newer version, please test on staging and [share your versions, steps, and results on GitHub](https://github.com/Jahid07/woo-subscription-trial-coupon/issues). Please do not upload paid plugin files, license keys, or customer data.

[Testing details and known coverage limits](https://github.com/Jahid07/woo-subscription-trial-coupon/blob/master/docs/testing.md) are maintained in the development repository. Automatic payment gateways, actual renewal charges, subscription variations, and sign-up fee coupon combinations have not been verified in the 3.0.0 checks.

= Getting started =

1. Go to **Marketing > Coupons** and add a coupon.
2. Choose **Subscription Trial** as the discount type.
3. Enter the **Free trial** length and select its period.
4. Set any coupon restrictions and publish the coupon.
5. Add a subscription product to the cart and apply the code. Review the trial and recurring totals before placing an order.

= Demo =

[Explore the demo store](https://demo.coderplus.co/woo-subscription-trial-coupon/) for example trial offers. Create and test your own coupon codes on your store.

= Other plugins by CoderPlus =

**Data Privacy Manager for WooCommerce (Premium)**
Data Privacy Manager is a WooCommerce GDPR plugin that helps you process personal data requests and manage customer permissions and privacy choices. Review requests, manage approvals, follow up with customers, and track outcomes with permission records and staff access controls.
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

== Frequently Asked Questions ==

= Does it work without WooCommerce Subscriptions? =

No. Both WooCommerce and the paid WooCommerce Subscriptions extension must be installed and activated.

= How do I offer a different trial period with a coupon? =

Create a "Subscription Trial" coupon, enter the trial length and period, and publish it. Customers apply the code in the cart or checkout when signing up for an eligible subscription.

= Can I combine a trial with a sign-up fee discount? =

The plugin adds trial fields to WooCommerce Subscriptions' fixed and percentage sign-up fee discount coupon types. Test your product and coupon combination on staging before using it in your store.

= Does it discount subscription renewals? =

No. The plugin focuses on the initial trial period and sign-up fee coupon settings; it does not add renewal discounts.

= Does it support WooCommerce Cart and Checkout blocks? =

Yes. Version 3.0.0 adds trial price and first payment information to the native Cart and Checkout blocks. Classic cart and checkout pages are also supported. The blocks use WooCommerce’s extension APIs and retain the standard layout.

= Why does the cart show £0 today and a monthly price? =

For an eligible subscription without a sign-up fee, the trial coupon can make the initial subscription payment zero. The recurring price still applies after the trial. Other items, shipping, taxes, or fees can affect the order total; always review the checkout totals. The currency follows your store settings.

= Does a trial coupon change the first payment date? =

The trial period affects when the subscription’s first payment is due. For supported coupons, the plugin shows the original and updated first payment dates using WooCommerce Subscriptions’ calculated schedule. The standard subscription schedule remains the source of the payment dates.

= Will my existing trial coupons continue to work after updating? =

Version 3.0.0 keeps the existing coupon type and trial length and period settings. No coupon recreation is required. Back up your store and try the update on staging before updating a live subscription store.

= Have you tested the latest WooCommerce Subscriptions release? =

Our available test copy is version 7.7.0. We welcome staging-test reports from users with newer versions. See the compatibility section above for the exact tested stack and contribution link.

== Screenshots ==

1. Create a Subscription Trial coupon: choose a code, set the free-trial length and period, and publish.
2. Compare a subscription before and after a trial coupon: £0 due today in this example, with the recurring price and first payment dates clearly shown.
3. WooCommerce Cart block showing the trial badge, initial payment, and recurring subscription totals.
4. WooCommerce Checkout block showing the trial offer, first payment date comparison, and recurring payment summary.

== Changelog ==

= 3.0.0 =
* See the trial offer in WooCommerce Cart and Checkout blocks as well as classic pages.
* Understand what is due today and what will be charged after the trial with clearer subscription pricing and a free-trial badge.
* Compare the first payment date before and after applying a supported trial coupon.
* Keep the standard subscription display for sign-up fees, synchronized billing, and other unsupported comparison cases.
* Refresh plugin icons, banners, setup screenshots, and customer guidance.

= 2.0.3 =
* Update the Data Privacy Manager description in the Other plugins by CoderPlus section.

= 2.0.2 =
* Fix a PHP deprecation when a trial coupon is rejected for a cart without subscription products.
* Clear obsolete validation errors when the same coupon is checked again after the cart changes.
* Tested with WordPress 7.1.4 and WooCommerce 11.2.1 using WooCommerce Subscriptions 7.7.0.
* Clarify setup instructions, compatibility coverage, and community testing information.

= 2.0.1 - September 24, 2024 =
- Improve code quality
= 2.0.0 - September 24, 2024 =
* Refactor the plugin into classes and improve localization, security, dependency detection, and WooCommerce integration.
= 1.0.1 - Octobor 26, 2019 =
- Improve code
= 1.0.0 - Octobor 25, 2019 =
- initial release

