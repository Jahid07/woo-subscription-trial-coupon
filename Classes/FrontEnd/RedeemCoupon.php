<?php


/**
 * This code for the front end coupon submition
 *
 * This class defines all code necessary to run during the coupon creation & coupon applyed.
 *
 * @since      2.0.0
 * @package    WooSubscriptionTrialCoupon
 * @subpackage woo-subscription-trial-coupon/inc
 * @author     Jahid <contact@jahid.co>
 */


namespace CoderPlus\WooSubscriptionTrialCoupon\FrontEnd;

use WC_Coupon;
class RedeemCoupon{

    public function init(){

        add_action( 'woocommerce_before_calculate_totals', [$this, 'before_caculate_cart_total'], 15, 1 ); 
         // Add custom validation for the 'trial_test' coupon type
        add_filter('woocommerce_coupon_is_valid', [$this, 'validate_coupon'], 10, 2);
        // Customize the error message for the specific case
        add_filter('woocommerce_coupon_error', [$this, 'coupon_error_message'], 10, 3);

        //Add lebel for the trial coupon
        add_filter('woocommerce_cart_totals_coupon_label', [$this, 'coupon_label_for_cart'], 10, 2);

        //Customize the woocommerce  disocunt priching optin
        add_filter('woocommerce_coupon_discount_amount_html', [$this, 'coupon_discount_amount_html'], 10, 2);
        
    }
   /**
     * Update cart data with coupon trial lenght & trial period before calculate cart data
     * 
     * @param $cart
     */
   
     public function before_caculate_cart_total($cart)
     {  
             
         if($cart->get_applied_coupons()){
             // Get Coupon id
             $coupon_id = $cart->get_applied_coupons()[0];
             $coupon = new WC_Coupon( $coupon_id );
            
           
 
             $coupon_trial_length = $coupon->get_meta('_wcsc_coupon_trial_length');
             $coupon_trial_period = $coupon->get_meta('_wcsc_coupon_trial_period');
 
            
             // Check if the coupon apply
             if($coupon_trial_length>0)
             {                          
                 foreach( $cart->cart_contents as $cart_item_id=>$cart_item ) {
 
                     if(is_a($cart_item['data'], 'WC_Product_Subscription') || is_a($cart_item['data'], 'WC_Product_Subscription_Variation'))
                         {
                             $cart_item['data']->update_meta_data('_subscription_trial_length', $coupon_trial_length, true);
                             $cart_item['data']->update_meta_data('_subscription_trial_period', $coupon_trial_period, true);
                         }
                 }
             }
         }
     }


    
    public function validate_coupon($valid, $coupon) {
        if ($coupon->get_discount_type() === 'subscription_trial') {
            $cart_items = WC()->cart->get_cart();
            $has_subscription = false;

            foreach ($cart_items as $cart_item) {
                $product = $cart_item['data'];
                if ($product->is_type('subscription') || $product->is_type('subscription_variation') ) {
                    $has_subscription = true;
                    break;
                }
            }

            // If no subscription product is found, invalidate the coupon
            if (!$has_subscription) {
                $valid = false;
                // Set a custom error code to identify this specific error
                $coupon->error_code = 'no_subscription_in_cart';
            }
        }

        return $valid;
    }

    
    public function coupon_error_message($err, $err_code, $coupon) {
        if (isset($coupon->error_code) && $coupon->error_code === 'no_subscription_in_cart') {
            // Replace the default error message with a specific one
            $err = __('This coupon is only valid if there is a subscription product in the cart.', 'WooSubscriptionTrialCoupon');
        }
        return $err;
    }


    

    /**
     * Modify the coupon label in the cart totals.
     */
    function coupon_label_for_cart($label, $coupon) {
        if ($coupon->get_discount_type() === 'subscription_trial') {
            $label = __('Free Trial', 'woocommerce'); // Keep "Free Trial" as the label
        }
        return $label;
    }


    /**
     * Modify the coupon discount amount HTML to show discount and trial period.
     *
     * @param string $discount_html The default HTML for the discount.
     * @param WC_Coupon $coupon The coupon object.
     * @return string Modified discount HTML.
     */
    public function coupon_discount_amount_html($discount_html, $coupon) {
        // Check if the coupon type is sign_up_fee or sign_up_fee_percent
        if ($coupon->get_discount_type() === 'sign_up_fee' || $coupon->get_discount_type() === 'sign_up_fee_percent') {
            // Get the discount amount first
            $amount = WC()->cart->get_coupon_discount_amount($coupon->get_code(), WC()->cart->display_cart_ex_tax);
            $discount_html = '-' . wc_price($amount);

            // Get the trial length and period from the coupon metadata
            $trial_length = $coupon->get_meta('_wcsc_coupon_trial_length');
            $trial_period = $coupon->get_meta('_wcsc_coupon_trial_period');
            
            // If trial length and period are present, add the second line for the trial period
            if ($trial_length && $trial_period) {
                $period_label = $this->get_proper_time_unit($trial_length, $trial_period);
                $discount_html .= sprintf('<br><span>%s: %d %s </span>', __('Free Trial', 'WooSubscriptionTrialCoupon'), $trial_length, $period_label);
            }

        // Handle subscription_trial type coupon
        } elseif ($coupon->get_discount_type() === 'subscription_trial') {
            $trial_length = $coupon->get_meta('_wcsc_coupon_trial_length');
            $trial_period = $coupon->get_meta('_wcsc_coupon_trial_period');
            
            // If trial length and period are present, show the trial period
            if ($trial_length && $trial_period) {
                $period_label = $this->get_proper_time_unit($trial_length, $trial_period);
                $discount_html = sprintf(__('%d %s ', 'WooSubscriptionTrialCoupon'), $trial_length, ucfirst($period_label));
            } else {
                $discount_html = __('Free Trial Period', 'WooSubscriptionTrialCoupon');
            }
        }

        return $discount_html;
    }

    /**
     * Helper function to get singular or plural time units based on the value.
     *
     * @param int $value The number of units.
     * @param string $unit The time unit (day, week, month, year).
     * @return string Proper singular or plural time unit.
     */
    private function get_proper_time_unit($value, $unit) {
        // Convert unit to lowercase to ensure consistency
        $unit = strtolower($unit);

        // Check the value and return the correct form
        switch ($unit) {
            case 'day':
                return $value == 1 ? 'day' : 'days';
            case 'week':
                return $value == 1 ? 'week' : 'weeks';
            case 'month':
                return $value == 1 ? 'month' : 'months';
            case 'year':
                return $value == 1 ? 'year' : 'years';
            default:
                return $unit; // In case of an unexpected unit, return it as-is
        }
    }
     
}