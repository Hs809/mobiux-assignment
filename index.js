const fs = require("fs");
const { groupBy, maxBy } = require("lodash");

function readSalesData(filename) {
  return new Promise((resolve, reject) => {
    fs.readFile(filename, "utf8", (err, data) => {
      if (err) {
        reject(err);
      } else {
        const salesData = data
          .trim()
          .split("\n")
          .map((row) => {
            const [Date, Item, price, Quantity, Total] = row.split(",");
            return { Date, Item, price, Quantity, Total: Total.slice(0, 3) };
          });
        resolve(salesData);
      }
    });
  });
}

function calculateTotalSales(salesData) {
  return salesData.reduce(
    (total, row) => Number(total + parseFloat(row.Total)),
    0
  );
}

function calculateMonthlySales(salesData) {
  const monthlySales = {};
  salesData.forEach((row) => {
    const monthNames = ["January", "February", "March"];
    const month = monthNames[new Date(row.Date.split("/")).getMonth()];
    if (!monthlySales[month]) {
      monthlySales[month] = 0;
    }
    monthlySales[month] += parseFloat(row.Total);
  });
  return monthlySales;
}
const monthNames = ["January", "February", "March"];
function findMostPopularItem(salesData) {
  const itemsQuantityInMonth = {};
  const popularItems = {};
  salesData.forEach((row) => {
    const month = monthNames[new Date(row.Date.split("/")).getMonth()];
    const itemIndexOf = itemsQuantityInMonth[month]?.findIndex(
      (item) => item.name == row.Item
    );
    if (itemIndexOf >= 0) {
      itemsQuantityInMonth[month][itemIndexOf].quantity =
        Number(itemsQuantityInMonth[month][itemIndexOf].quantity) +
        Number(row.Quantity);
    } else {
      if (itemsQuantityInMonth[month]) {
        itemsQuantityInMonth[month] = [
          ...itemsQuantityInMonth[month],
          { name: row.Item, quantity: row.Quantity },
        ];
      } else {
        itemsQuantityInMonth[month] = [
          { name: row.Item, quantity: row.Quantity },
        ];
      }
    }
  });
  Object.keys(itemsQuantityInMonth).forEach((key) => {
    let maxQuantityItem = { name: "", quantity: 0 };
    itemsQuantityInMonth[key].map((item) => {
      if (item.quantity > maxQuantityItem?.quantity) {
        maxQuantityItem = item;
      }
    });
    console.log({ maxQuantityItem });
    popularItems[key] = maxQuantityItem;
  });
  console.log({
    popularItems: JSON.stringify(popularItems),
    itemsQuantityInMonth: JSON.stringify(itemsQuantityInMonth),
  });

  return popularItems;
}

function findRevenuePerItem(salesData) {
  const revenuePerItem = {};
  salesData.forEach((row) => {
    const month = monthNames[new Date(row.Date.split("/")).getMonth()];
    if (!revenuePerItem[month]) {
      revenuePerItem[month] = [];
    }
    const existingItem = revenuePerItem[month].find(
      (item) => item.Item === row.Item
    );
    if (existingItem) {
      existingItem.Revenue += parseFloat(row.Total);
    } else {
      revenuePerItem[month].push({
        Item: row.Item,
        Revenue: parseFloat(row.Total),
      });
    }
  });
  Object.keys(revenuePerItem).map((month) => {
    let maxRevenueItem = { Item: "", Revenue: 0 };
    revenuePerItem[month].forEach((item) => {
      if (item.Revenue > maxRevenueItem.Revenue) {
        maxRevenueItem = item;
      }
    });
    revenuePerItem[month] = maxRevenueItem;
  });
  return revenuePerItem;
}

function findOrderStatistics(salesData, item) {
  const orderCounts = groupBy(
    salesData.filter((row) => row.Item === item),
    (row) => row.Date.split("/")[0]
  );
  const orderStatisticsByDay = {};
  Object.entries(orderCounts).forEach(([day, counts]) => {
    orderStatisticsByDay[day] = {
      day,
      order: counts.length,
    };
  });

  let groupByMonth = groupBy(
    orderStatisticsByDay,
    (row) => monthNames[new Date(row.day.split("/")).getMonth()]
  );
  console.log({
    groupByMonth: JSON.stringify(groupByMonth),
    orderStatisticsByDay: JSON.stringify(orderStatisticsByDay),
  });
  let monthlyOrderReport = {};
  Object.entries(groupByMonth).forEach(([month, orders], index) => {
    let minOrders = Number.MAX_VALUE;
    let maxOrders = Number.MIN_VALUE;
    let avgOrders = 0;
    orders.forEach((item) => {
      console.log({ item });
      if (item.order < minOrders) {
        minOrders = item.order;
      }
      if (item.order > maxOrders) {
        maxOrders = item.order;
      }
      avgOrders += item.order;
    });

    monthlyOrderReport[month] = {
      minOrders,
      maxOrders,
      avgOrders,
    };
  });
  console.log({ monthlyOrderReport });
  return monthlyOrderReport;
}

// Specify the path to the sales data text file
const salesDataFile = "sales_data.txt";

// Read the sales data
readSalesData(salesDataFile)
  .then((salesData) => {
    // Calculate total sales
    const totalSales = calculateTotalSales(salesData);
    console.log(`Total Sales: $${totalSales}`);

    // Calculate month-wise sales totals
    const monthlySales = calculateMonthlySales(salesData);
    console.log("Month-wise Sales Totals:");
    Object.entries(monthlySales).forEach(([month, sales]) => {
      console.log(`${month}: $${sales}`);
    });

    // Find the most popular item in each month
    const popularItems = findMostPopularItem(salesData);
    console.log("Most Popular Item in Each Month:", { popularItems });
    // Object.entries(popularItems).forEach(([month, item]) => {
    //   console.log(`${month}: ${item.Item} (Quantity: ${item.Quantity})`);
    // });

    // Find items generating the most revenue in each month
    const revenuePerItem = findRevenuePerItem(salesData);
    console.log("Items Generating Most Revenue in Each Month:");
    Object.entries(revenuePerItem).forEach(([month, item]) => {
      console.log(
        `Month: ${month} Item Name: ${item.Item} Revenue:  $${item.Revenue}`
      );
    });

    // Find order statistics for the most popular item
    const mostPopularItem = maxBy(
      Object.entries(popularItems),
      ([, item]) => item
    )[1].name;

    const orderStatistics = findOrderStatistics(salesData, mostPopularItem);
    console.log(`Order Statistics for Most Popular Item (${mostPopularItem}):`);
    Object.entries(orderStatistics).forEach(([month, statistics]) => {
      console.log(
        `${month}: Min: ${statistics.minOrders} | Max: ${statistics.maxOrders} | Avg: ${statistics.avgOrders}`
      );
    });
  })
  .catch((error) => {
    console.error("Error reading sales data:", error);
  });
