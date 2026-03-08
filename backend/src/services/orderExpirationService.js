const Order = require('../models/Order');

const EXPIRATION_CHECK_INTERVAL_MS = Math.max(
    60 * 1000,
    Number(process.env.ORDER_EXPIRATION_CHECK_INTERVAL_MS || 5 * 60 * 1000)
);

function runExpirationSweep() {
    try {
        const result = Order.expirePendingInstagramOrders();
        if (result.expiredCount > 0) {
            console.log(
                `[orders] Expirados ${result.expiredCount} pedido(s) manuales. Stock repuesto: ${result.restockedItems} unidad(es).`
            );
        }
    } catch (error) {
        console.error('[orders] Error expirando pedidos manuales:', error);
    }
}

function startOrderExpirationJob() {
    runExpirationSweep();
    return setInterval(runExpirationSweep, EXPIRATION_CHECK_INTERVAL_MS);
}

module.exports = {
    startOrderExpirationJob,
    runExpirationSweep
};
