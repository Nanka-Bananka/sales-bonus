/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product, quant) {
  const discount = 1 - purchase.discount / 100;
  return _product * discount * quant;
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
  const { profit } = seller;
  if (index === 0) {
    return profit * 0.15;
  } else if (index === total - 1) {
    return 0;
  } else if (index === 1 || index === 2) {
    return profit * 0.1;
  } else {
    return profit * 0.05;
  }
}

/**
 * Функция для анализа данных продаж
 *c
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
  const { calculateRevenue, calculateBonus } = options;

  const sellerStats = data.sellers.map((seller) => ({
    seller_id: seller.id,
    name: `${seller.first_name} ${seller.last_name}`,
  }));

  const sellerIndex = Object.fromEntries(
    sellerStats.map((item) => [item["seller_id"], item]),
  );
  const productIndex = Object.fromEntries(
    data.products.map((item) => [item["sku"], item]),
  );

  data["purchase_records"].forEach((record) => {
    const seller = sellerIndex[record["seller_id"]];
    if (!seller["sales_count"]) {
      seller["sales_count"] = 0;
    }
    seller["sales_count"] += 1;

    if (!seller["revenue"]) {
      seller["revenue"] = 0;
    }
    seller["revenue"] += record["total_amount"];

    if (!seller["profit"]) {
      seller["profit"] = 0;
    }

    if (!seller.products_sold) {
      seller.products_sold = {};
    }

    record.items.forEach((item) => {
      const product = productIndex[item.sku];
      const cost = product["purchase_price"] * item["quantity"];
      const revenue = calculateRevenue(
        item,
        item["sale_price"],
        item["quantity"],
      );
      seller["profit"] += revenue - cost;

      if (!(item.sku in seller.products_sold)) {
        seller.products_sold[item.sku] = 0;
      }
      seller.products_sold[item.sku] += item.quantity;
    });
  });

  sellerStats.sort((selA, selB) => selB.profit - selA.profit);

  sellerStats.forEach(function (sel, index) {
    sel.bonus = calculateBonus(index, sellerStats.length, sel);
    sel.top_products = Object.entries(sel.products_sold).map(([sku, qty]) => ({
      sku,
      quantity: qty,
    }));
    sel.top_products.sort((prodA, prodB) => prodB.quantity - prodA.quantity);
    sel.top_products = sel.top_products.slice(0, 10);
  });

  return sellerStats.map((stat) => ({
    seller_id: stat.seller_id,
    name: stat.name,
    revenue: +stat.revenue.toFixed(2),
    profit: +stat.profit.toFixed(2),
    sales_count: stat.sales_count,
    top_products: stat.top_products,
    bonus: +stat.bonus.toFixed(2),
  }));
}
