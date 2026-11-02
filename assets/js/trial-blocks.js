(function () {
    'use strict';
    if (!window.wc || !window.wc.blocksCheckout) return;
    var __ = window.wp.i18n.__;
    var namespace = 'wcsc-trial-price';
    function details(extensions) {
        var data = extensions && extensions[namespace];
        return data && data.comparison ? data : null;
    }
    window.wc.blocksCheckout.registerCheckoutFilters(namespace, {
        cartItemClass: function (value, extensions) {
            return details(extensions) ? (value + ' wcsc-trial-item').trim() : value;
        },
        subtotalPriceFormat: function (value, extensions) {
            var data = details(extensions);
            if (!data) return value;
            // Only the supported <price/> component is interpolated by WooCommerce.
            return '<price/> → ' + data.today + ' ' + __('today', 'WooSubscriptionTrialCoupon') +
                ' · ' + __('Then', 'WooSubscriptionTrialCoupon') + ' ' + data.recurring;
        },
        cartItemPrice: function (value, extensions) {
            return details(extensions) ? '<price/> ' + __('today', 'WooSubscriptionTrialCoupon') : value;
        }
    });
}());
