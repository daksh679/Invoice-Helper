const GST_RATE = 0.18;
const HALF_GST_RATE = 0.09;

const form = document.getElementById("bill-form");
const taxModeInput = document.getElementById("tax-mode");
const addItemButton = document.getElementById("add-item-btn");
const lineItemsEl = document.getElementById("line-items");
const lineItemTemplate = document.getElementById("line-item-template");
const resultsBodyEl = document.getElementById("results-body");
const columnTaxOneEl = document.getElementById("column-tax-one");
const columnTaxTwoEl = document.getElementById("column-tax-two");

const baseAmountEl = document.getElementById("base-amount");
const taxAmountEl = document.getElementById("tax-amount");
const taxPartOneEl = document.getElementById("tax-part-one");
const taxPartTwoEl = document.getElementById("tax-part-two");
const taxLabelOneEl = document.getElementById("tax-label-one");
const taxLabelTwoEl = document.getElementById("tax-label-two");
const finalAmountEl = document.getElementById("final-amount");

const formatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatCurrency(value) {
  return formatter.format(Number.isFinite(value) ? value : 0);
}

function calculateBreakdown(totalAmount, mode) {
  const taxableValue = totalAmount / (1 + GST_RATE);
  const totalTax = totalAmount - taxableValue;

  if (mode === "igst") {
    return {
      taxableValue,
      totalTax,
      firstTaxLabel: "IGST (18%)",
      firstTaxValue: totalTax,
      secondTaxLabel: "-",
      secondTaxValue: 0,
    };
  }

  return {
    taxableValue,
    totalTax,
    firstTaxLabel: "CGST (9%)",
    firstTaxValue: taxableValue * HALF_GST_RATE,
    secondTaxLabel: "SGST (9%)",
    secondTaxValue: taxableValue * HALF_GST_RATE,
  };
}

function createLineItem(name = "", amount = "") {
  const fragment = lineItemTemplate.content.cloneNode(true);
  const itemEl = fragment.querySelector(".line-item");
  const nameInput = fragment.querySelector(".item-name");
  const amountInput = fragment.querySelector(".item-total");
  const removeButton = fragment.querySelector(".remove-btn");

  nameInput.value = name;
  amountInput.value = amount;

  removeButton.addEventListener("click", () => {
    itemEl.remove();
    if (!lineItemsEl.children.length) {
      createLineItem();
    }
    renderBill();
  });

  nameInput.addEventListener("input", renderBill);
  amountInput.addEventListener("input", renderBill);

  lineItemsEl.appendChild(fragment);
}

function getItems() {
  return Array.from(lineItemsEl.querySelectorAll(".line-item"))
    .map((itemEl, index) => {
      const name = itemEl.querySelector(".item-name").value.trim() || `Item ${index + 1}`;
      const totalAmount = Number.parseFloat(itemEl.querySelector(".item-total").value);
      return {
        name,
        totalAmount: Number.isFinite(totalAmount) && totalAmount > 0 ? totalAmount : 0,
      };
    })
    .filter((item) => item.totalAmount > 0);
}

function renderRows(items, mode) {
  if (!items.length) {
    resultsBodyEl.innerHTML = '<tr><td colspan="5" class="empty-state">Add products and generate the bill to see the breakdown.</td></tr>';
    return {
      taxableValue: 0,
      totalTax: 0,
      firstTaxValue: 0,
      secondTaxValue: 0,
      totalAmount: 0,
    };
  }

  const totals = {
    taxableValue: 0,
    totalTax: 0,
    firstTaxValue: 0,
    secondTaxValue: 0,
    totalAmount: 0,
  };

  resultsBodyEl.innerHTML = items
    .map((item) => {
      const breakdown = calculateBreakdown(item.totalAmount, mode);

      totals.taxableValue += breakdown.taxableValue;
      totals.totalTax += breakdown.totalTax;
      totals.firstTaxValue += breakdown.firstTaxValue;
      totals.secondTaxValue += breakdown.secondTaxValue;
      totals.totalAmount += item.totalAmount;

      return `
        <tr>
          <td>${item.name}</td>
          <td>${formatCurrency(breakdown.taxableValue)}</td>
          <td>${formatCurrency(breakdown.firstTaxValue)}</td>
          <td>${mode === "igst" ? "-" : formatCurrency(breakdown.secondTaxValue)}</td>
          <td>${formatCurrency(item.totalAmount)}</td>
        </tr>
      `;
    })
    .join("");

  return totals;
}

function renderSummary(totals, mode) {
  if (mode === "igst") {
    columnTaxOneEl.textContent = "IGST";
    columnTaxTwoEl.textContent = "-";
    taxLabelOneEl.textContent = "IGST (18%)";
    taxLabelTwoEl.textContent = "Other Tax";
  } else {
    columnTaxOneEl.textContent = "CGST";
    columnTaxTwoEl.textContent = "SGST";
    taxLabelOneEl.textContent = "CGST (9%)";
    taxLabelTwoEl.textContent = "SGST (9%)";
  }

  baseAmountEl.textContent = formatCurrency(totals.taxableValue);
  taxAmountEl.textContent = formatCurrency(totals.totalTax);
  taxPartOneEl.textContent = formatCurrency(totals.firstTaxValue);
  taxPartTwoEl.textContent = mode === "igst" ? "-" : formatCurrency(totals.secondTaxValue);
  finalAmountEl.textContent = formatCurrency(totals.totalAmount);
}

function renderBill() {
  const mode = taxModeInput.value;
  const items = getItems();
  const totals = renderRows(items, mode);
  renderSummary(totals, mode);
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  renderBill();
});

taxModeInput.addEventListener("change", renderBill);
addItemButton.addEventListener("click", () => createLineItem());

createLineItem("Product 1", "");
createLineItem("Product 2", "");
renderBill();
