<?php

/**
 * Fired diffrent admin notice, if depended plugin is not installed or any upcomong news event
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
class WCSC_Admin_Notice {

    
	/**
	 * This method will run upon deactivation
	 *
	 * Long Description.
	 *
	 * @since    1.0.0
	 */
	public static function check_requre_plugin() {

		// Flush rewrite rules upon deactivation
        // Admin notice method 
        
         $check_woocommerce = in_array( 'woocommerce/woocommerce.php', apply_filters( 'active_plugins', get_option( 'active_plugins' ) ) );

        $check_woocommerce_subscription = in_array( 'woocommerce-subscriptions/woocommerce-subscriptions.php', apply_filters( 'active_plugins', get_option( 'active_plugins' ) ) );

        $check_and = (($check_woocommerce || $check_woocommerce_subscription)? '' : '&');

       
            ?>
            <div class="notice notice-error">
                <p><?php _e( 'Error! Woo Subscription Trial Coupon Plugin only works with '.(!$check_woocommerce? 'Woocommerce': '').' '.$check_and.' '.(!$check_woocommerce_subscription? 'Woocmmerce Subscription' : '').' plugin. Please install and active  '.(!$check_woocommerce ? '<a target="_blank" href="https://wordpress.org/plugins/woocommerce/">Woocmmerce</a>' : '').' '.$check_and.' '. (!$check_woocommerce_subscription ? '<a target="_blank" href="https://woocommerce.com/products/woocommerce-subscriptions/">Woocmmerce Subscription</a>' : '') .' plugin first ', 'WooSubscriptionTrialCoupon' ); ?></p>
            </div>
            <?php        
	}

}
