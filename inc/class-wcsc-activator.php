<?php

/**
 * Fired during plugin activation
 *
 * @link       https://jahid.co/
 * @since      1.0.0
 *
 * @package    WooSubscriptionTrialCoupon
 * @subpackage woo-subscription-trial-coupon/inc
 */

/**
 * Fired during plugin activation.
 *
 * This class defines all code necessary to run during the plugin's activation.
 *
 * @since      1.0.0
 * @package    WooSubscriptionTrialCoupon
 * @subpackage woo-subscription-trial-coupon/inc
 * @author     Jahid <contact@jahid.co>
 */
class WCSC_Activator {

	/**
	 * This static method will run when activate the plugin
	 *
	 * Long Description.
	 *
	 * @since    1.0.0
	 */
	public static function activate() {

		// Flush rewrite rules upon activation
		flush_rewrite_rules( );
	}

}