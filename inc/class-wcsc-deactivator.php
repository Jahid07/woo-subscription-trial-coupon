<?php

/**
 * Fired during plugin deactivation
 *
 * @link       https://jahid.co/
 * @since      1.0.0
 *
 * @package    WooSubscriptionTrialCoupon
 * @subpackage woo-subscription-trial-coupon/inc
 */

/**
 * Fired during plugin deactivation.
 *
 * This class defines all code necessary to run during the plugin's deactivation.
 *
 * @since      1.0.0
 * @package    WooSubscriptionTrialCoupon
 * @subpackage woo-subscription-trial-coupon/inc
 * @author     Jahid <contact@jahid.co>
 */
class WCSC_Deactivator {

	/**
	 * This method will run upon deactivation
	 *
	 * Long Description.
	 *
	 * @since    1.0.0
	 */
	public static function deactivate() {

		// Flush rewrite rules upon deactivation
		flush_rewrite_rules( );
	}

}
