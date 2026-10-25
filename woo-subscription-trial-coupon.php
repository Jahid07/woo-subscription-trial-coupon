<?php 
/*
Plugin Name: Free Trial Coupon for Woocommerce Subscriptions
Plugin URI: https://jahid.co/plugins
Description: Wooc Subscription Trial Coupon will add option in Woocommerce coupon filed. This plugin will work with only if you have activate Woocommerce & Woocomerce Subscription enabled
Author: Jahid
Author URI: https://jahid.co
Version: 2.0.1
Requires Plugins: woocommerce
License: GPLv2 or later
Tags: Woocommerce Subscription Trial Coupon, Trial Coupon, Free Trial Coupon, Woocommerce subscription Free trial Coupon, Extends Free trial
Text Domain: WooSubscriptionTrialCoupon
*/

/*
This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see 

copyright 2005 to 2015 Auttomatic, Inc.
 */

 // If this file is called directly, abort.
defined('ABSPATH') or die('Hello boro what are you doing here? Aren\'t you human?');

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
	die;
}

// Include the Composer autoloader
require_once __DIR__ . '/vendor/autoload.php';


use CoderPlus\WooSubscriptionTrialCoupon\Admin\Activator;
use CoderPlus\WooSubscriptionTrialCoupon\Admin\AdminNotice;
use CoderPlus\WooSubscriptionTrialCoupon\Admin\Deactivator;
use CoderPlus\WooSubscriptionTrialCoupon\Admin\TrialCoupon;
use CoderPlus\WooSubscriptionTrialCoupon\FrontEnd\RedeemCoupon;


/**
 * Currently plugin version.
 * Start at version 2.0.1
 * Rename this for your plugin and update it as you release new versions.
 */
define( 'WCSC_VERSION', '2.0.1' );

define('WCSC_PLUGIN_URL', plugin_dir_url(__FILE__));



/**
 * The code that runs during plugin activation.
 * This action is documented in includes/class-jahid-activator.php
 */
function activate_wcsc_trial_coupon() {
	Activator::activate();
}

/**
 * The code that runs during plugin deactivation.
 * This action is documented in includes/class-jahid-deactivator.php
 */
function deactivate_wcsc_trial_coupon() {
	Deactivator::deactivate();
}

register_activation_hook( __FILE__, 'activate_wcsc_trial_coupon' );
register_deactivation_hook( __FILE__, 'deactivate_wcsc_trial_coupon' );

/**
 * The core plugin class that is used to define internationalization,
 * admin-specific hooks, and public-facing site hooks.
 */


/**
 * Begins execution of the plugin.
 *
 * Since everything within the plugin is registered via hooks,
 * then kicking off the plugin from this point in the file does
 * not affect the page life cycle.
 *
 * @since    1.0.0
 */

if ( in_array( 'woocommerce-subscriptions/woocommerce-subscriptions.php', apply_filters( 'active_plugins', get_option( 'active_plugins' ) ) ) && in_array( 'woocommerce/woocommerce.php', apply_filters( 'active_plugins', get_option( 'active_plugins' ) ) ) ) {    
    
    $WooSubscriptionTrialCouponTC = new TrialCoupon();
    $WooSubscriptionTrialCouponRC = new RedeemCoupon();
    $WooSubscriptionTrialCouponTC->init(); 
    $WooSubscriptionTrialCouponRC->init(); 

}else{   

    add_action('admin_notices', [AdminNotice::class, 'check_requre_plugin']);
}