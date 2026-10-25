<?php

/**
 * Fired during plugin activation.
 *
 * This class defines all code necessary to run during the plugin's activation.
 *
 * @since      1.0.0
 * @package    WooSubscriptionTrialCoupon
 * @subpackage woo-subscription-trial-coupon/Class
 * @author     Jahid <contact@jahid.co>
 */

namespace CoderPlus\WooSubscriptionTrialCoupon\Admin;

class Activator {

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