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
 * This class defines all code necessary to run during the coupon creation & coupon applyed.
 *
 * @since      1.0.0
 * @package    WooSubscriptionTrialCoupon
 * @subpackage woo-subscription-trial-coupon/inc
 * @author     Jahid <contact@jahid.co>
 */

class WCSC_Trial_Coupon{

    public $coupon_trial_length = '_wcsc_coupon_trial_length';
    public $coupon_trial_period = '_wcsc_coupon_trial_period';

    public function init(){

        // Add necesarry hooks
        add_action( 'admin_enqueue_scripts', [$this, 'enqueue_style_script']);        
        add_filter( 'woocommerce_coupon_discount_types', [$this, 'create_discount_type'], 10, 1);
        add_action( 'woocommerce_coupon_options', [$this, 'add_discount_fields'], 20, 1 );
        add_action( 'woocommerce_coupon_options_save', [$this, 'save_coupon_fileds'], 10, 1 );
        add_filter('woocommerce_subscriptions_validate_coupon_type', [$this, 'trial_coupon_validation'], 5, 3);
        add_action( 'woocommerce_before_calculate_totals', [$this, 'before_caculate_cart_total'], 15, 1 ); 

    }

    /**
     * JS for Woocommerce Coupon Meta Box
     * @param $discount_types
     */
    public static function enqueue_style_script()
    {
        $screen    = get_current_screen();
        $screen_id = isset( $screen->id ) ? $screen->id : '';
        
        if(in_array( $screen_id, array( 'shop_coupon', 'edit-shop_coupon' ) ))
        {
            wp_enqueue_script( 'meta-boxes-trial-coupon-js', WCSC_PLUGIN_URL.'assets/js/meta-boxes-coupon.js', array('jquery'), WCSC_VERSION, true );
        }

       
    }




    /**
     * Add descount type subscription trial
     * @param $discount_types
     */
    public function create_discount_type($discount_types){
        
            $discount_types['subscription_trial'] =__( 'Subscription Trial', 'woocommerce' );
            return $discount_types;
    }

    /**
     * add coupon filed
     * @param $coupon_id
     */

    public function add_discount_fields($coupon_id){

       
        $coupon = new WC_Coupon( $coupon_id );
        
            ?>
            <p class="form-field subscription_coupon_trial_length_field">

            <label for="_wcsc_coupon_trial_length"><?php esc_html_e( 'Free trial', 'woocommerce-subscriptions' ); ?></label>

            <span class="wrap">

                <input type="number" id="_wcsc_coupon_trial_length" name="_wcsc_coupon_trial_length" class="wc_input_subscription_trial_length" value="<?php echo esc_attr( $coupon->get_meta($this->coupon_trial_length) ); ?>" />

                <label for="_wcsc_coupon_trial_period" style="display:none" class="wcs_hidden_label"><?php esc_html_e( 'Subscription Trial Period', 'woocommerce-subscriptions' ); ?></label>

                <select id="_wcsc_coupon_trial_period" name="_wcsc_coupon_trial_period" class="wc_input_subscription_trial_period last" >
                    <?php foreach ( wcs_get_available_time_periods() as $value => $label ) { ?>
                        <option value="<?php echo esc_attr( $value ); ?>" <?php selected( $value, esc_attr( $coupon->get_meta($this->coupon_trial_period) ), true ) ?>><?php echo esc_html( $label ); ?></option>
                    <?php } ?>
                </select>

            </span>

            <?php echo wcs_help_tip('An optional period of time to wait before charging the first recurring payment. Any sign up fee will still be charged at the outset of the subscription' ); ?>
        </p><?php
    }

    /**
     * Save coupon fileds
     * @param $coupon_id
     */
    public function save_coupon_fileds($coupon_id){

        $coupon = new WC_Coupon( $coupon_id );
        // Check the nonce (again).
        if ( empty( $_POST['woocommerce_meta_nonce'] ) || ! wp_verify_nonce( $_POST['woocommerce_meta_nonce'], 'woocommerce_save_data' ) ) {
            return;
        }    
        
        $coupon->add_meta_data( $this->coupon_trial_length, wc_clean( $_POST['_wcsc_coupon_trial_length'] ), true );
        $coupon->add_meta_data( $this->coupon_trial_period, wc_clean( $_POST['_wcsc_coupon_trial_period'] ), true );
        $coupon->save();
    }

    /**
     * Validate coupon type instead of directly add it to woocommerce We add in under woocommerce subscription plugin
     * @param $coupon_id
     */
    public function trial_coupon_validation($arg1, $coupon, $valid){

        if($coupon->is_type('subscription_trial')){
       
            $coupon_trial_length = esc_attr( $coupon->get_meta('_wcsc_coupon_trial_length') );
            $coupon_trial_period = esc_attr( $coupon->get_meta('_wcsc_coupon_trial_period') );
            if(!empty($coupon_trial_length) && !empty($coupon_trial_period)){
                
                    return false;
            }
        }
        return $valid;
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

    public static function admin_notice(){}
    
}
